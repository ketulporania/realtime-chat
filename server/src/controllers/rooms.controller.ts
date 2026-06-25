import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, "Room name is required")
    .max(64, "Room name must be at most 64 characters")
    .trim(),
  isPrivate: z.boolean().optional().default(false),
});

const MESSAGES_PAGE_SIZE = 50;

function getRoomId(req: Request): string {
  const { roomId } = req.params;
  return Array.isArray(roomId) ? roomId[0] : roomId;
}

async function getMembership(userId: string, roomId: string) {
  return prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
}

function formatRoom(
  room: {
    id: string;
    name: string;
    isPrivate: boolean;
    createdAt: Date;
    _count?: { members: number };
  },
  isMember: boolean
) {
  return {
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    createdAt: room.createdAt,
    memberCount: room._count?.members ?? 0,
    isMember,
  };
}

export async function listRooms(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;

  const memberRoomIds = (
    await prisma.roomMember.findMany({
      where: { userId },
      select: { roomId: true },
    })
  ).map((m) => m.roomId);

  const rooms = await prisma.room.findMany({
    where: {
      OR: [{ isPrivate: false }, { id: { in: memberRoomIds } }],
    },
    include: {
      _count: { select: { members: true } },
      members: { where: { userId }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    rooms: rooms.map((room) =>
      formatRoom(room, room.members.length > 0)
    ),
  });
}

export async function createRoom(req: Request, res: Response): Promise<void> {
  const parsed = createRoomSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const userId = req.userId!;
  const { name, isPrivate } = parsed.data;

  const room = await prisma.room.create({
    data: {
      name,
      isPrivate,
      members: {
        create: { userId },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  res.status(201).json({ room: formatRoom(room, true) });
}

export async function getRoom(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const roomId = getRoomId(req);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      _count: { select: { members: true } },
      members: { where: { userId }, select: { id: true } },
    },
  });

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const isMember = room.members.length > 0;

  if (room.isPrivate && !isMember) {
    res.status(403).json({ error: "You do not have access to this room" });
    return;
  }

  res.json({ room: formatRoom(room, isMember) });
}

export async function joinRoom(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const roomId = getRoomId(req);

  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const existing = await getMembership(userId, roomId);

  if (existing) {
    res.json({ message: "Already a member of this room" });
    return;
  }

  if (room.isPrivate) {
    res.status(403).json({ error: "Cannot join a private room" });
    return;
  }

  await prisma.roomMember.create({
    data: { userId, roomId },
  });

  res.status(201).json({ message: "Joined room successfully" });
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  const userId = req.userId!;
  const roomId = getRoomId(req);
  const cursor = req.query.cursor as string | undefined;

  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const membership = await getMembership(userId, roomId);

  if (!membership) {
    res.status(403).json({ error: "You must join this room to view messages" });
    return;
  }

  let cursorMessage: { createdAt: Date; id: string } | null = null;

  if (cursor) {
    cursorMessage = await prisma.message.findFirst({
      where: { id: cursor, roomId },
      select: { createdAt: true, id: true },
    });

    if (!cursorMessage) {
      res.status(400).json({ error: "Invalid cursor" });
      return;
    }
  }

  const messages = await prisma.message.findMany({
    where: {
      roomId,
      ...(cursorMessage
        ? {
            OR: [
              { createdAt: { lt: cursorMessage.createdAt } },
              {
                createdAt: cursorMessage.createdAt,
                id: { lt: cursorMessage.id },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MESSAGES_PAGE_SIZE + 1,
    include: {
      user: {
        select: { id: true, username: true, avatarColor: true },
      },
    },
  });

  const hasMore = messages.length > MESSAGES_PAGE_SIZE;
  const page = hasMore ? messages.slice(0, MESSAGES_PAGE_SIZE) : messages;
  const ordered = [...page].reverse();

  const nextCursor = hasMore ? ordered[0]?.id ?? null : null;

  res.json({
    messages: ordered.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      userId: msg.userId,
      roomId: msg.roomId,
      username: msg.user.username,
      avatarColor: msg.user.avatarColor,
    })),
    nextCursor,
    hasMore,
  });
}
