/** REST API base URL. Production uses same-origin Vercel proxy. */
export function getApiBaseUrl(): string {
  if (process.env.NODE_ENV === "production") return "";
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:4000";
}

/** Socket.io server URL. Same-origin in production when not explicitly configured. */
export function getSocketBaseUrl(): string {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return window.location.origin;
  }
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:4000";
}
