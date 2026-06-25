# Pulse — Server (API + Socket.io)

Express + TypeScript backend for **Pulse**, a real-time chat app. Handles REST auth/rooms, WebSocket messaging via Socket.io, and PostgreSQL persistence through Prisma.

---

## Tech stack

- Node.js + Express + TypeScript
- Socket.io (real-time chat, presence, typing)
- PostgreSQL + Prisma 7
- JWT auth in httpOnly cookies
- bcrypt + zod

---

## Prerequisites

- **Node.js 20+**
- **PostgreSQL 15+** (local) or a managed Postgres provider (production)
- npm

---

## Project structure

```
server/
├── src/
│   ├── index.ts              # Entry point (HTTP + Socket.io)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── sockets/
│   └── utils/
├── prisma.config.ts
├── package.json
└── .env                      # Local only — never commit
```

---

## Step 1 — Install dependencies

```bash
cd server
npm install
```

---

## Step 2 — Environment variables

Create a `.env` file in the `server/` folder:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realtime_chat"
JWT_SECRET="use-a-long-random-string-at-least-32-characters"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_URL="http://localhost:3000"
NODE_ENV="development"
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (long random string) |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `PORT` | No | Server port (default: `4000`) |
| `CLIENT_URL` | Yes | Frontend origin for CORS and Socket.io (no trailing slash) |
| `NODE_ENV` | Yes (prod) | Set to `production` when deployed |

**Production example:**

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-production-secret-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

> **Important:** `CLIENT_URL` must exactly match your deployed frontend URL (including `https://`).

---

## Step 3 — Local PostgreSQL setup

### 3.1 Start PostgreSQL

**Windows (PowerShell as Administrator):**

```powershell
Start-Service postgresql-x64-18
```

Or open `services.msc` → start **postgresql-x64-18**.

**macOS (Homebrew):**

```bash
brew services start postgresql@16
```

### 3.2 Create the database

```bash
psql -U postgres -c "CREATE DATABASE realtime_chat;"
```

### 3.3 Run migrations

```bash
npm run db:generate
npm run db:migrate
```

This creates tables: `User`, `Room`, `RoomMember`, `Message`.

### 3.4 Verify

```bash
npm run dev
```

Open: [http://localhost:4000/health](http://localhost:4000/health)

Expected response:

```json
{ "status": "ok" }
```

---

## Step 4 — Local development

```bash
npm run dev
```

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply migrations (development) |

---

## Step 5 — Production database (Neon recommended)

Use a managed PostgreSQL service so you never run Postgres manually in production.

### Option A — Neon (free tier)

1. Go to [https://neon.tech](https://neon.tech) and create an account.
2. Create a new project (e.g. `pulse-chat`).
3. Copy the **connection string** (Pooled or Direct).
4. Append `?sslmode=require` if not already included.
5. Set it as `DATABASE_URL` on your hosting platform.

### Option B — Supabase

1. Go to [https://supabase.com](https://supabase.com) → New project.
2. Open **Project Settings → Database**.
3. Copy the **URI** connection string.
4. Set it as `DATABASE_URL`.

### Option C — Railway Postgres

If you deploy the server on Railway, add a **PostgreSQL** plugin in the same project. Railway injects `DATABASE_URL` automatically.

---

## Step 6 — Deploy backend (Railway)

Recommended for Express + Socket.io + Postgres in one place.

### 6.1 Push code to GitHub

Make sure the repo includes the `server/` folder and migrations under `server/src/prisma/migrations/`.

### 6.2 Create Railway project

1. Go to [https://railway.app](https://railway.app) → **New Project**.
2. Choose **Deploy from GitHub repo**.
3. Select your repository.
4. Set **Root Directory** to `server`.

### 6.3 Add PostgreSQL (if not using Neon/Supabase)

1. In the project, click **+ New** → **Database** → **PostgreSQL**.
2. Railway creates `DATABASE_URL` for you.

### 6.4 Set environment variables

In Railway → your service → **Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | From Neon / Supabase / Railway Postgres |
| `JWT_SECRET` | Long random secret (32+ characters) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Your Vercel URL, e.g. `https://pulse.vercel.app` |
| `NODE_ENV` | `production` |

Railway sets `PORT` automatically — do not hardcode it.

### 6.5 Build & deploy settings

**Build command:**

```bash
npm install && npx prisma generate && npm run build && npx prisma migrate deploy
```

**Start command:**

```bash
npm start
```

### 6.6 Get your public URL

1. Railway → service → **Settings** → **Networking** → **Generate Domain**.
2. Copy the URL, e.g. `https://pulse-api.up.railway.app`.
3. Test: `https://pulse-api.up.railway.app/health`

Use this URL in the **client** env vars (`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`).

---

## Step 7 — Deploy backend (Render alternative)

1. Go to [https://render.com](https://render.com) → **New Web Service**.
2. Connect GitHub repo, set **Root Directory** to `server`.
3. **Runtime:** Node
4. **Build command:**

   ```bash
   npm install && npx prisma generate && npm run build && npx prisma migrate deploy
   ```

5. **Start command:**

   ```bash
   npm start
   ```

6. Add the same environment variables as in Step 6.4.
7. Use the Render URL (e.g. `https://pulse-api.onrender.com`) in the client.

> Render free tier may sleep after inactivity. Railway or a paid plan is better for demos.

---

## Step 8 — Connect frontend after deploy

After the client is deployed on Vercel:

1. Set `CLIENT_URL` on the server to your Vercel URL.
2. Redeploy the server so CORS and Socket.io pick up the new origin.

**Deploy order:**

1. Deploy **server** + database first
2. Copy server URL
3. Deploy **client** with server URL in env vars
4. Update `CLIENT_URL` on server to match client URL
5. Redeploy server

---

## Cross-origin cookies (production)

In production, the frontend (Vercel) and backend (Railway/Render) run on **different domains**. Auth uses httpOnly cookies with `credentials: "include"`.

This project is configured for that setup:

- **Development:** `sameSite: "lax"`, `secure: false` (works on `localhost`)
- **Production:** `sameSite: "none"`, `secure: true` (required for cross-site API + Socket.io)

Both frontend and backend must be served over **HTTPS** in production.

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/rooms` | List rooms |
| POST | `/api/rooms` | Create room |
| POST | `/api/rooms/:id/join` | Join room |
| GET | `/api/rooms/:id/messages` | Message history |

Socket.io connects to the same host as the API (`NEXT_PUBLIC_SOCKET_URL`).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED` on login | PostgreSQL is not running locally, or `DATABASE_URL` is wrong in production |
| CORS error in browser | `CLIENT_URL` does not match the frontend URL exactly |
| Login works locally but not in production | Ensure `NODE_ENV=production` on the server and both apps use HTTPS |
| Socket connects but auth fails | Ensure `withCredentials: true` on client and CORS `credentials: true` on server |
| Prisma migration fails | Run `npx prisma migrate deploy` in build step, not `migrate dev` |
| SSL error with Neon/Supabase | Add `?sslmode=require` to `DATABASE_URL` |

---

## Security checklist (production)

- [ ] Strong `JWT_SECRET` (never commit to Git)
- [ ] `NODE_ENV=production`
- [ ] HTTPS on both client and server
- [ ] `CLIENT_URL` locked to your real frontend domain only
- [ ] Database credentials only in hosting env vars

---

## Related

- Frontend setup: [`../client/README.md`](../client/README.md)
- Full project spec: [`../README.md`](../README.md)
