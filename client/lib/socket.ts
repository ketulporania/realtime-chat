import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./socket-types";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let socket: ChatSocket | null = null;

export function getSocket(): ChatSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): ChatSocket {
  const instance = getSocket();
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
