import "dotenv/config";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.routes";
import roomsRoutes from "./routes/rooms.routes";
import { setupChatSocket } from "./sockets/chat.socket";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types/socket";

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

setupChatSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
