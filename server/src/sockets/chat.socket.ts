import { Server, Socket } from "socket.io";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/socket";
import { getTokenFromCookieHeader } from "../utils/cookies";
import { verifyToken } from "../utils/jwt";

type ChatServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

type ChatSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

const roomIdSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
});

const messageSendSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be at most 2000 characters")
    .trim(),
});

/** Tracks how many socket connections each user has per room (multi-tab safe). */
const roomPresenceCounts = new Map<string, Map<string, number>>();

function getOnlineUserIds(roomId: string): string[] {
  const counts = roomPresenceCounts.get(roomId);
  return counts ? Array.from(counts.keys()) : [];
}

function addToPresence(roomId: string, userId: string): void {
  if (!roomPresenceCounts.has(roomId)) {
    roomPresenceCounts.set(roomId, new Map());
  }
  const counts = roomPresenceCounts.get(roomId)!;
  counts.set(userId, (counts.get(userId) ?? 0) + 1);
}

function removeFromPresence(roomId: string, userId: string): void {
  const counts = roomPresenceCounts.get(roomId);
  if (!counts) return;

  const next = (counts.get(userId) ?? 1) - 1;
  if (next <= 0) {
    counts.delete(userId);
  } else {
    counts.set(userId, next);
  }

  if (counts.size === 0) {
    roomPresenceCounts.delete(roomId);
  }
}

function broadcastPresence(io: ChatServer, roomId: string): void {
  io.to(roomId).emit("presence:update", {
    roomId,
    onlineUserIds: getOnlineUserIds(roomId),
  });
}

async function isRoomMember(
  userId: string,
  roomId: string
): Promise<boolean> {
  const membership = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  return !!membership;
}

function emitError(socket: ChatSocket, message: string): void {
  socket.emit("error", { message });
}

async function handleRoomJoin(
  io: ChatServer,
  socket: ChatSocket,
  roomId: string
): Promise<void> {
  const { userId } = socket.data;

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    emitError(socket, "Room not found");
    return;
  }

  if (!(await isRoomMember(userId, roomId))) {
    emitError(socket, "You must join this room first");
    return;
  }

  if (socket.data.joinedRooms.has(roomId)) {
    return;
  }

  await socket.join(roomId);
  socket.data.joinedRooms.add(roomId);
  addToPresence(roomId, userId);
  broadcastPresence(io, roomId);
}

function handleRoomLeave(io: ChatServer, socket: ChatSocket, roomId: string): void {
  if (!socket.data.joinedRooms.has(roomId)) {
    return;
  }

  socket.leave(roomId);
  socket.data.joinedRooms.delete(roomId);
  removeFromPresence(roomId, socket.data.userId);
  broadcastPresence(io, roomId);
}

function handleDisconnect(io: ChatServer, socket: ChatSocket): void {
  for (const roomId of socket.data.joinedRooms) {
    removeFromPresence(roomId, socket.data.userId);
    broadcastPresence(io, roomId);
  }
  socket.data.joinedRooms.clear();
}

export function setupChatSocket(io: ChatServer): void {
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromCookieHeader(socket.handshake.headers.cookie);

      if (!token) {
        next(new Error("Authentication required"));
        return;
      }

      const { userId } = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });

      if (!user) {
        next(new Error("User not found"));
        return;
      }

      socket.data.userId = user.id;
      socket.data.username = user.username;
      socket.data.joinedRooms = new Set();
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: ChatSocket) => {
    socket.on("room:join", async (payload) => {
      const parsed = roomIdSchema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, "Invalid room:join payload");
        return;
      }
      await handleRoomJoin(io, socket, parsed.data.roomId);
    });

    socket.on("room:leave", (payload) => {
      const parsed = roomIdSchema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, "Invalid room:leave payload");
        return;
      }
      handleRoomLeave(io, socket, parsed.data.roomId);
    });

    socket.on("message:send", async (payload) => {
      const parsed = messageSendSchema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, parsed.error.issues[0]?.message ?? "Invalid message");
        return;
      }

      const { roomId, content } = parsed.data;
      const { userId, username } = socket.data;

      if (!(await isRoomMember(userId, roomId))) {
        emitError(socket, "You must join this room first");
        return;
      }

      const message = await prisma.message.create({
        data: { content, userId, roomId },
      });

      io.to(roomId).emit("message:new", {
        id: message.id,
        content: message.content,
        userId: message.userId,
        username,
        roomId: message.roomId,
        createdAt: message.createdAt.toISOString(),
      });
    });

    socket.on("typing:start", (payload) => {
      const parsed = roomIdSchema.safeParse(payload);
      if (!parsed.success) return;

      const { roomId } = parsed.data;
      if (!socket.data.joinedRooms.has(roomId)) return;

      socket.to(roomId).emit("typing:update", {
        roomId,
        userId: socket.data.userId,
        username: socket.data.username,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (payload) => {
      const parsed = roomIdSchema.safeParse(payload);
      if (!parsed.success) return;

      const { roomId } = parsed.data;
      if (!socket.data.joinedRooms.has(roomId)) return;

      socket.to(roomId).emit("typing:update", {
        roomId,
        userId: socket.data.userId,
        username: socket.data.username,
        isTyping: false,
      });
    });

    socket.on("disconnect", () => {
      handleDisconnect(io, socket);
    });
  });
}
