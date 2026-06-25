/** REST API base URL. Empty string = same-origin (Vercel proxy to Railway). */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return "";
  return "http://localhost:4000";
}

/** Socket.io server URL. Same-origin in production when not explicitly configured. */
export function getSocketBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return window.location.origin;
  }
  return "http://localhost:4000";
}
