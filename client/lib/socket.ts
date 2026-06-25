import { io, Socket } from "socket.io-client";
import { getSocketBaseUrl } from "@/lib/config";
import { ClientToServerEvents, ServerToClientEvents } from "./socket-types";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

const SOCKET_OPTIONS = {
  withCredentials: true,
  autoConnect: false,
  path: "/socket.io",
  /** Polling first — more reliable through Vercel → Railway proxy, then upgrades. */
  transports: ["polling", "websocket"] as ("polling" | "websocket")[],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
};

function resolveSocketUrl(): string {
  return getSocketBaseUrl();
}

export function getSocket(): ChatSocket {
  if (!socket) {
    socket = io(resolveSocketUrl(), SOCKET_OPTIONS);
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

/** True while Socket.io is attempting to reconnect after a drop. */
export function isSocketReconnecting(): boolean {
  return socket?.active === true && socket.connected === false;
}
