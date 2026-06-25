import { io, Socket } from "socket.io-client";
import { getSocketBaseUrl } from "@/lib/config";
import { ClientToServerEvents, ServerToClientEvents } from "./socket-types";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

function resolveSocketUrl(): string {
  return getSocketBaseUrl();
}

export function getSocket(): ChatSocket {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
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
