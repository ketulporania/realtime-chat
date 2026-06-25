/**
 * Manual Socket.io smoke test. Requires PostgreSQL + migrated DB + running server.
 *
 * Usage: node scripts/test-socket.mjs
 */
import { io } from "socket.io-client";

const API_URL = process.env.API_URL || "http://localhost:4000";

async function main() {
  const registerRes = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: "secret123",
    }),
  });

  if (!registerRes.ok) {
    console.error("Register failed:", registerRes.status, await registerRes.text());
    process.exit(1);
  }

  const cookie = registerRes.headers.get("set-cookie")?.split(";")[0] ?? "";
  console.log("Registered, cookie obtained");

  const roomRes = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ name: "Socket Test Room", isPrivate: false }),
  });

  if (!roomRes.ok) {
    console.error("Create room failed:", roomRes.status, await roomRes.text());
    process.exit(1);
  }

  const { room } = await roomRes.json();
  console.log("Room created:", room.id);

  const socket = io(API_URL, {
    withCredentials: true,
    extraHeaders: { Cookie: cookie },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("room:join", { roomId: room.id });
    socket.emit("message:send", {
      roomId: room.id,
      content: "Hello from socket test!",
    });
  });

  socket.on("presence:update", (payload) => {
    console.log("presence:update", payload);
  });

  socket.on("message:new", (payload) => {
    console.log("message:new", payload);
    console.log("Socket test passed!");
    socket.disconnect();
    process.exit(0);
  });

  socket.on("error", (payload) => {
    console.error("socket error:", payload);
  });

  socket.on("connect_error", (err) => {
    console.error("connect_error:", err.message);
    process.exit(1);
  });

  setTimeout(() => {
    console.error("Timeout waiting for message:new");
    process.exit(1);
  }, 10000);
}

main();
