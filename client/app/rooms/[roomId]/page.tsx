"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell, MobileTopBar } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatWindow } from "@/components/ChatWindow";
import { OnlineUsersList } from "@/components/OnlineUsersList";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  ChatMessage,
  UserProfile,
} from "@/lib/api";
import { fetchRoom, fetchRoomMessages } from "@/lib/rooms-api";
import { connectSocket } from "@/lib/socket";
import {
  MessageNewPayload,
  PresenceUpdatePayload,
  TypingUpdatePayload,
} from "@/lib/socket-types";

function upsertProfile(
  map: Map<string, UserProfile>,
  userId: string,
  profile: UserProfile
): Map<string, UserProfile> {
  const next = new Map(map);
  next.set(userId, profile);
  return next;
}

function profilesFromMessages(
  messages: ChatMessage[],
  currentUser?: { id: string; username: string; avatarColor: string } | null
): Map<string, UserProfile> {
  const map = new Map<string, UserProfile>();
  for (const msg of messages) {
    map.set(msg.userId, {
      username: msg.username,
      avatarColor: msg.avatarColor ?? "#6366f1",
    });
  }
  if (currentUser) {
    map.set(currentUser.id, {
      username: currentUser.username,
      avatarColor: currentUser.avatarColor,
    });
  }
  return map;
}

function LiveBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 sm:px-2 sm:text-[11px] ${
        connected
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-red-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? "bg-emerald-500 animate-pulse" : "bg-red-400"
        }`}
      />
      {connected ? "Live" : "Off"}
    </span>
  );
}

function RoomChat({ roomId }: { roomId: string }) {
  const { user, logout } = useAuth();
  const [roomName, setRoomName] = useState("Chat room");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(
    () => new Map()
  );
  const [typingByUserId, setTypingByUserId] = useState<Map<string, string>>(
    () => new Map()
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [socketToast, setSocketToast] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const initializedRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const roomIdRef = useRef(roomId);

  roomIdRef.current = roomId;

  const typingUsers = useMemo(
    () => Array.from(typingByUserId.values()),
    [typingByUserId]
  );

  const showSocketToast = useCallback((message: string) => {
    setSocketToast(message);
  }, []);

  useEffect(() => {
    if (!user) return;

    setUserProfiles((prev) =>
      upsertProfile(prev, user.id, {
        username: user.username,
        avatarColor: user.avatarColor,
      })
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const socket = connectSocket();

    const joinRoom = () => {
      socket.emit("room:join", { roomId: roomIdRef.current });
    };

    const onConnect = () => {
      setSocketConnected(true);
      setReconnecting(false);
      wasConnectedRef.current = true;
      setSocketToast(null);
      if (initializedRef.current) {
        joinRoom();
      }
    };

    const onDisconnect = (reason: string) => {
      setSocketConnected(false);
      if (!wasConnectedRef.current) return;

      if (reason === "io server disconnect") {
        socket.connect();
      }

      setReconnecting(true);
      setSocketToast("Reconnecting...");
    };

    const onConnectError = () => {
      setSocketConnected(false);
      if (socket.active) {
        setReconnecting(true);
        setSocketToast("Reconnecting...");
        return;
      }
      setReconnecting(false);
      showSocketToast("Could not connect to chat. Check your network.");
    };

    const onReconnectFailed = () => {
      setReconnecting(false);
      showSocketToast("Connection lost. Reload the page to reconnect.");
    };

    const onMessageNew = (payload: MessageNewPayload) => {
      if (payload.roomId !== roomId) return;

      setUserProfiles((prev) =>
        upsertProfile(prev, payload.userId, {
          username: payload.username,
          avatarColor: prev.get(payload.userId)?.avatarColor ?? "#6366f1",
        })
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [
          ...prev,
          {
            id: payload.id,
            content: payload.content,
            userId: payload.userId,
            username: payload.username,
            roomId: payload.roomId,
            createdAt: payload.createdAt,
            avatarColor:
              payload.userId === user.id ? user.avatarColor : undefined,
          },
        ];
      });
    };

    const onPresenceUpdate = (payload: PresenceUpdatePayload) => {
      if (payload.roomId !== roomId) return;
      setOnlineUserIds(payload.onlineUserIds);
    };

    const onTypingUpdate = (payload: TypingUpdatePayload) => {
      if (payload.roomId !== roomId) return;

      setUserProfiles((prev) =>
        upsertProfile(prev, payload.userId, {
          username: payload.username,
          avatarColor: prev.get(payload.userId)?.avatarColor ?? "#6366f1",
        })
      );

      setTypingByUserId((prev) => {
        const next = new Map(prev);
        if (payload.isTyping && payload.userId !== user.id) {
          next.set(payload.userId, payload.username);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    const onSocketError = (payload: { message: string }) => {
      showSocketToast(payload.message);
    };

    async function init() {
      setLoading(true);
      setLoadError("");

      try {
        const [room, messagesData] = await Promise.all([
          fetchRoom(roomId),
          fetchRoomMessages(roomId),
        ]);

        if (cancelled) return;

        setRoomName(room.name);
        setMessages(messagesData.messages ?? []);
        setUserProfiles(
          profilesFromMessages(messagesData.messages ?? [], user)
        );
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Failed to load chat. Please try again."
          );
        }
        setLoading(false);
        return;
      }

      if (cancelled) return;

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);
      socket.io.on("reconnect_failed", onReconnectFailed);
      socket.on("message:new", onMessageNew);
      socket.on("presence:update", onPresenceUpdate);
      socket.on("typing:update", onTypingUpdate);
      socket.on("error", onSocketError);

      if (!socket.connected) {
        socket.connect();
      } else {
        onConnect();
      }

      socket.emit("room:join", { roomId });
      initializedRef.current = true;
      setLoading(false);
    }

    init();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!initializedRef.current) return;
      if (!socket.connected) {
        socket.connect();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (initializedRef.current) {
        socket.emit("room:leave", { roomId });
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.off("message:new", onMessageNew);
      socket.off("presence:update", onPresenceUpdate);
      socket.off("typing:update", onTypingUpdate);
      socket.off("error", onSocketError);
      initializedRef.current = false;
    };
  }, [roomId, user?.id, showSocketToast]);

  const handleSendMessage = useCallback(
    (content: string) => {
      const socket = connectSocket();
      if (!socket.connected) {
        setReconnecting(true);
        setSocketToast("Reconnecting...");
        socket.connect();
        return;
      }
      socket.emit("message:send", { roomId, content });
    },
    [roomId]
  );

  const handleTypingStart = useCallback(() => {
    if (!socketConnected) return;
    connectSocket().emit("typing:start", { roomId });
  }, [roomId, socketConnected]);

  const handleTypingStop = useCallback(() => {
    if (!socketConnected) return;
    connectSocket().emit("typing:stop", { roomId });
  }, [roomId, socketConnected]);

  const retryLoad = useCallback(() => {
    window.location.reload();
  }, []);

  if (!user) return null;

  const onlineSidebar = (
    <OnlineUsersList
      onlineUserIds={onlineUserIds}
      userProfiles={userProfiles}
      currentUserId={user.id}
      variant="sidebar"
    />
  );

  return (
    <AppShell user={user} onLogout={logout} sidebar={onlineSidebar}>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <MobileTopBar
          title={roomName}
          subtitle={`${onlineUserIds.length} online`}
          backHref="/rooms"
          backLabel="Rooms"
          user={user}
          onLogout={logout}
          badge={<LiveBadge connected={socketConnected && !reconnecting} />}
        />

        {loadError && (
          <div className="shrink-0 px-4 pt-4 lg:px-8">
            <AlertBanner
              message={loadError}
              onDismiss={() => setLoadError("")}
              onRetry={retryLoad}
            />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:p-4 xl:p-6">
          <div className="card-shadow flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-slate-200/80">
            {loading ? (
              <div className="flex flex-1 items-center justify-center py-24">
                <Spinner label="Loading messages..." />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <ChatWindow
                  messages={messages}
                  currentUserId={user.id}
                  typingUsers={typingUsers}
                  onSendMessage={handleSendMessage}
                  onTypingStart={handleTypingStart}
                  onTypingStop={handleTypingStop}
                  disabled={!socketConnected}
                  roomName={roomName}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {socketToast && (
        <Toast
          message={socketToast}
          variant={
            reconnecting ? "warning" : socketConnected ? "warning" : "error"
          }
          onDismiss={() => setSocketToast(null)}
        />
      )}
    </AppShell>
  );
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);

  return (
    <AuthGuard>
      <RoomChat roomId={roomId} />
    </AuthGuard>
  );
}
