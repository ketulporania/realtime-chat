export interface RoomJoinPayload {
  roomId: string;
}

export interface RoomLeavePayload {
  roomId: string;
}

export interface MessageSendPayload {
  roomId: string;
  content: string;
}

export interface TypingPayload {
  roomId: string;
}

export interface MessageNewPayload {
  id: string;
  content: string;
  userId: string;
  username: string;
  roomId: string;
  createdAt: string;
}

export interface PresenceUpdatePayload {
  roomId: string;
  onlineUserIds: string[];
}

export interface TypingUpdatePayload {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface SocketErrorPayload {
  message: string;
}

export interface ClientToServerEvents {
  "room:join": (payload: RoomJoinPayload) => void;
  "room:leave": (payload: RoomLeavePayload) => void;
  "message:send": (payload: MessageSendPayload) => void;
  "typing:start": (payload: TypingPayload) => void;
  "typing:stop": (payload: TypingPayload) => void;
}

export interface ServerToClientEvents {
  "message:new": (payload: MessageNewPayload) => void;
  "presence:update": (payload: PresenceUpdatePayload) => void;
  "typing:update": (payload: TypingUpdatePayload) => void;
  error: (payload: SocketErrorPayload) => void;
}
