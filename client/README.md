# Pulse — Client (Next.js Frontend)

Next.js App Router frontend for **Pulse**, a real-time team chat app. Connects to the Express + Socket.io backend for auth, rooms, and live messaging.

---

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Socket.io client
- zod (form validation)

---

## Prerequisites

- **Node.js 20+**
- npm
- A running **Pulse server** (local or deployed)

---

## Project structure

```
client/
├── app/
│   ├── login/
│   ├── register/
│   ├── rooms/
│   └── rooms/[roomId]/
├── components/
├── context/
│   └── AuthContext.tsx
├── lib/
│   ├── api.ts           # REST calls (credentials: include)
│   ├── socket.ts        # Socket.io singleton
│   └── brand.ts
├── package.json
└── .env.local           # Local only — never commit
```

---

## Step 1 — Install dependencies

```bash
cd client
npm install
```

---

## Step 2 — Environment variables

Create `.env.local` in the `client/` folder:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend REST API base URL (no trailing slash) |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Backend Socket.io URL (same as API in most setups) |

> Variables prefixed with `NEXT_PUBLIC_` are embedded at **build time**. You must **redeploy** after changing them in production.

**Production example** (replace with your deployed server URL):

```env
NEXT_PUBLIC_API_URL="https://pulse-api.up.railway.app"
NEXT_PUBLIC_SOCKET_URL="https://pulse-api.up.railway.app"
```

---

## Step 3 — Local development

### 3.1 Start the backend first

In a separate terminal:

```bash
cd ../server
npm run dev
```

Confirm: [http://localhost:4000/health](http://localhost:4000/health) returns `{ "status": "ok" }`.

### 3.2 Start the frontend

```bash
cd client
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

### 3.3 Available scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Run production build locally |
| `npm run lint` | ESLint |

---

## Step 4 — Test the app locally

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **Register** and create an account
3. Create or join a room
4. Open a second browser tab (or incognito) with another account
5. Join the same room and send messages — they should appear in real time

---

## Step 5 — Deploy to Vercel (production)

Vercel is the recommended host for Next.js.

### 5.1 Push code to GitHub

Ensure the repo includes the `client/` folder (not a nested git repo).

### 5.2 Import project on Vercel

1. Go to [https://vercel.com](https://vercel.com) → **Add New Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `client`.
4. Framework Preset should auto-detect **Next.js**.

### 5.3 Configure environment variables

Production uses a **same-origin API proxy** on Vercel (auth cookies work in all browsers). Set **one** of these server-side URLs:

| Name | Value | Environments |
|---|---|---|
| `BACKEND_URL` | `https://your-server.up.railway.app` | Production, Preview |

**Or** use `NEXT_PUBLIC_API_URL` with the same Railway URL if you prefer — the proxy reads either variable. Include `https://`.

Do **not** set `NEXT_PUBLIC_SOCKET_URL` in production — Socket.io uses the same Vercel origin automatically.

**Local development** still uses `client/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
```

### 5.4 Deploy

Click **Deploy**. Vercel runs `npm run build` automatically.

When finished, copy your live URL, e.g. `https://pulse.vercel.app`.

### 5.5 Update backend CORS

Go to your server hosting (Railway/Render) and set:

```env
CLIENT_URL="https://pulse.vercel.app"
```

Redeploy the server so CORS and Socket.io accept requests from your Vercel domain.

### 5.6 Verify production

1. Open your Vercel URL
2. Register a new account
3. Create a room and send a message
4. Open DevTools → **Network** — API calls should go to `your-app.vercel.app/api/...` (not Railway directly)

---

## Step 6 — Deploy order (full stack)

Follow this order to avoid broken links:

```
1. Deploy PostgreSQL (Neon / Supabase / Railway)
       ↓
2. Deploy server (Railway / Render)
   → run migrations, get server URL
       ↓
3. Deploy client (Vercel)
   → set NEXT_PUBLIC_API_URL + NEXT_PUBLIC_SOCKET_URL
       ↓
4. Update server CLIENT_URL to Vercel URL
   → redeploy server
       ↓
5. Test end-to-end
```

---

## Step 7 — Portfolio links

When sharing on your portfolio, use:

| Link | Share? |
|---|---|
| Vercel client URL | **Yes — primary "Live Demo"** |
| GitHub repo | **Yes** |
| Server URL | Optional (technical reviewers only) |
| Database / pgAdmin | **Never** |

Recruiters only need the **live demo link**. PostgreSQL runs in the cloud and is invisible to visitors.

Example portfolio card:

> **Pulse — Real-time Chat**  
> Live Demo · GitHub  
> Next.js · Express · Socket.io · PostgreSQL · Prisma  
> Team chat with rooms, JWT auth, live presence, and typing indicators.

---

## Optional — Test on mobile (same Wi‑Fi)

`localhost` on your phone refers to the phone itself, not your PC.

1. Find your PC IP: `ipconfig` → IPv4 (e.g. `192.168.1.42`)
2. Update `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL="http://192.168.1.42:4000"
   NEXT_PUBLIC_SOCKET_URL="http://192.168.1.42:4000"
   ```

3. Update `server/.env`:

   ```env
   CLIENT_URL="http://192.168.1.42:3000"
   ```

4. Restart both servers
5. On your phone: `http://192.168.1.42:3000`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| API calls go to `localhost:4000` in production | Redeploy Vercel after setting `NEXT_PUBLIC_*` env vars |
| CORS error | Server `CLIENT_URL` must match your Vercel URL exactly |
| Login fails in production | Set `NODE_ENV=production` on the server; both apps must use HTTPS |
| Socket won't connect | Check `NEXT_PUBLIC_SOCKET_URL` and that server supports WebSockets |
| Page loads but chat is empty | Confirm server is running and `/health` returns OK |
| Build fails on Vercel | Ensure **Root Directory** is set to `client` |

---

## Environment files (do not commit)

Add these to `.gitignore` (already configured at repo root):

```
client/.env.local
client/.env*.local
```

Use Vercel **Environment Variables** UI for production secrets and URLs.

---

## Related

- Backend setup & deploy: [`../server/README.md`](../server/README.md)
- Full project spec: [`../README.md`](../README.md)
