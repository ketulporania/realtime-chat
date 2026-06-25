# Project: RealTime Chat — Live Chat App with Rooms & Online Status

## 🎯 Goal
Build a production-style real-time chat application that demonstrates full-stack skills for a resume portfolio. It must support multiple chat rooms, persistent message history, JWT-based authentication, and live online/offline presence — all built with React, Next.js, Node.js, Express, Socket.io, and PostgreSQL.

This document is a complete build specification. Implement it phase by phase, in order. Do not skip a phase or merge phases together. After each phase, the app should run without errors before moving to the next.

---

## 🧱 Tech Stack
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Real-time layer:** Socket.io (server + client)
- **Database:** PostgreSQL
- **ORM:** Prisma (preferred — gives type-safe queries and easy migrations)
- **Auth:** JWT (access token in httpOnly cookie)
- **Password hashing:** bcrypt
- **Validation:** zod
- **Dev tools:** nodemon / ts-node-dev for backend hot reload

---

## 📁 Project Structure

Create a monorepo with two top-level folders:

```
realtime-chat/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── rooms/page.tsx
│   │   └── rooms/[roomId]/page.tsx
│   ├── components/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── RoomList.tsx
│   │   ├── OnlineUsersList.tsx
│   │   └── CreateRoomModal.tsx
│   ├── lib/
│   │   ├── socket.ts        # socket.io-client singleton
│   │   └── api.ts           # fetch wrapper for REST calls
│   ├── context/
│   │   └── AuthContext.tsx
│   └── ...
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── index.ts          # entry point, creates http server + socket.io
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   └── rooms.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── rooms.controller.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── sockets/
│   │   │   └── chat.socket.ts   # all socket.io event handlers
│   │   └── utils/
│   │       └── jwt.ts
│   └── ...
│
└── README.md
```

---

## 🗄️ Database Schema (PostgreSQL via Prisma)

Create `server/src/prisma/schema.prisma` with these models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  email        String    @unique
  passwordHash String
  avatarColor  String    @default("#6366f1")
  createdAt    DateTime  @default(now())
  messages     Message[]
  memberships  RoomMember[]
}

model Room {
  id          String       @id @default(uuid())
  name        String
  isPrivate   Boolean      @default(false)
  createdAt   DateTime     @default(now())
  messages    Message[]
  members     RoomMember[]
}

model RoomMember {
  id       String   @id @default(uuid())
  userId   String
  roomId   String
  joinedAt DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id])
  room     Room     @relation(fields: [roomId], references: [id])

  @@unique([userId, roomId])
}

model Message {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  userId    String
  roomId    String
  user      User     @relation(fields: [userId], references: [id])
  room      Room     @relation(fields: [roomId], references: [id])

  @@index([roomId, createdAt])
}
```

---

## 🔑 Environment Variables

`server/.env`
```
DATABASE_URL="postgresql://user:password@localhost:5432/realtime_chat"
JWT_SECRET="replace-with-a-long-random-string"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_URL="http://localhost:3000"
```

`client/.env.local`
```
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
```

---

## 🔌 REST API Endpoints

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create user, hash password, return JWT cookie |
| POST | `/api/auth/login` | No | Verify credentials, return JWT cookie |
| POST | `/api/auth/logout` | Yes | Clear cookie |
| GET | `/api/auth/me` | Yes | Return current logged-in user |
| GET | `/api/rooms` | Yes | List all public rooms + rooms the user belongs to |
| POST | `/api/rooms` | Yes | Create a new room |
| POST | `/api/rooms/:roomId/join` | Yes | Join a room (creates RoomMember row) |
| GET | `/api/rooms/:roomId/messages` | Yes | Paginated message history (last 50, cursor-based) |

---

## ⚡ Socket.io Events

**Client → Server**
- `room:join` `{ roomId }` — join a socket.io room channel
- `room:leave` `{ roomId }`
- `message:send` `{ roomId, content }`
- `typing:start` `{ roomId }`
- `typing:stop` `{ roomId }`

**Server → Client**
- `message:new` `{ id, content, userId, username, roomId, createdAt }`
- `presence:update` `{ roomId, onlineUserIds: string[] }`
- `typing:update` `{ roomId, userId, username, isTyping: boolean }`
- `error` `{ message }`

**Presence logic:** maintain an in-memory map `Map<roomId, Set<userId>>` on the server. On socket connect, decode the JWT from the cookie to identify the user. On `room:join`, add the user to the set and broadcast `presence:update` to that room. On `disconnect`, remove the user from all rooms they were in and broadcast updated presence for each.

---

## ✅ Build Plan — Implement in This Exact Order

### Phase 0 — Scaffolding
1. Create the `realtime-chat/` folder with `client/` and `server/` subfolders.
2. In `server/`: `npm init -y`, install `express cors cookie-parser bcrypt jsonwebtoken zod socket.io prisma @prisma/client dotenv`, plus dev deps `typescript ts-node-dev @types/node @types/express @types/cors @types/cookie-parser @types/bcrypt @types/jsonwebtoken`.
3. In `client/`: `npx create-next-app@latest client --typescript --tailwind --app`. Install `socket.io-client`.
4. Initialize Prisma in `server/` (`npx prisma init`), paste the schema above, run `npx prisma migrate dev --name init`.

### Phase 1 — Backend auth
1. Build `auth.controller.ts` with register/login/logout/me using bcrypt + JWT.
2. JWT should be set as an **httpOnly cookie**, not returned in the JSON body.
3. Build `auth.middleware.ts` to verify the JWT cookie and attach `req.userId`.
4. Wire up `auth.routes.ts` in `index.ts` under `/api/auth`.
5. Test all 4 auth endpoints with curl or Postman before moving on.

### Phase 2 — Backend rooms + REST
1. Build `rooms.controller.ts` for list/create/join/get-messages.
2. Protect all room routes with the auth middleware.
3. Test each endpoint manually.

### Phase 3 — Socket.io server
1. In `index.ts`, create a raw `http.Server` from the Express app, attach `socket.io` to it with `cors: { origin: CLIENT_URL, credentials: true }`.
2. On connection, parse the JWT from the cookie header to identify the user (reject the connection if invalid).
3. Implement `chat.socket.ts` with all events listed above, including the in-memory presence map.
4. On `message:send`, validate input, persist the message via Prisma, then broadcast `message:new` to everyone in that room (including the sender).

### Phase 4 — Frontend auth pages
1. Build `/login` and `/register` pages with forms (zod or basic validation).
2. Build `AuthContext` that calls `/api/auth/me` on mount to restore session, exposes `login`, `register`, `logout`.
3. Protect `/rooms` and `/rooms/[roomId]` — redirect to `/login` if not authenticated.

### Phase 5 — Frontend rooms list
1. Build `/rooms` page: fetch and display all rooms, button to create a new room (modal), click a room to join + navigate to `/rooms/[roomId]`.

### Phase 6 — Frontend chat window + Socket.io client
1. Create `lib/socket.ts`: a singleton that connects to `NEXT_PUBLIC_SOCKET_URL` with `withCredentials: true`.
2. On `/rooms/[roomId]`, on mount: fetch message history via REST, then emit `room:join`, then listen for `message:new`, `presence:update`, `typing:update`.
3. Build `ChatWindow.tsx` (scrollable message list, auto-scroll to bottom on new message), `MessageBubble.tsx` (style sender vs. others differently), an input box that emits `message:send` on submit and `typing:start`/`typing:stop` on input change (debounced).
4. Build `OnlineUsersList.tsx` showing avatars/usernames currently online in that room, driven by `presence:update`.
5. On unmount, emit `room:leave` and remove all socket listeners (critical — prevents duplicate listeners on re-render).

### Phase 7 — Polish
1. Add loading states and empty states (no messages yet, no rooms yet).
2. Add error handling: failed login shows inline error, socket connection errors show a toast/banner.
3. Add a "Room created at" and member count on the room list.
4. Style with Tailwind — make it look like a real product, not a tutorial.

### Phase 8 — Deployment
1. Push to GitHub with two folders (`client`, `server`) — note in the repo root README which is which.
2. Deploy `server/` to Render or Railway, with a free Postgres instance (Neon or Supabase also work — just update `DATABASE_URL`).
3. Deploy `client/` to Vercel, set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to the deployed backend URL.
4. Update backend CORS `origin` to the deployed Vercel URL.
5. Test the full live flow end-to-end: register two accounts in two browser tabs, join the same room, confirm messages and presence sync in real time.

---

## 🚫 Constraints & Rules for the AI Agent
- Do not use MongoDB or any NoSQL store — PostgreSQL only, via Prisma.
- Do not skip JWT verification on socket connection — every socket must be tied to an authenticated user.
- Do not store the JWT in localStorage — httpOnly cookies only (XSS protection).
- Always clean up socket listeners on component unmount in React (`useEffect` return function).
- Keep REST for anything that should be queryable/paginated (history, room list) and Socket.io only for live events (new messages, presence, typing) — don't replace REST entirely with sockets.
- Write TypeScript types/interfaces for all socket event payloads, shared between client and server if possible.

## ✨ Stretch Goals (only after Phases 0–8 are complete and working)
- Message read receipts
- File/image sharing in chat
- Private 1:1 DMs in addition to rooms
- Redis adapter for Socket.io (to support multiple server instances)
- Unit tests for controllers, integration test for the socket flow

---

## How to Run Locally
```bash
# Terminal 1 - backend
cd server
npm install
npx prisma migrate dev
npm run dev

# Terminal 2 - frontend
cd client
npm install
npm run dev
```
Visit `http://localhost:3000`.
