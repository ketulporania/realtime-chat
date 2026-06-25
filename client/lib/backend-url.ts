/**
 * Railway/backend URL for server-side proxy (Vercel route handler + socket rewrites).
 * Client never calls this directly in production — browser uses same-origin /api.
 */
export function resolveBackendUrl(): string | null {
  const raw =
    process.env.BACKEND_URL?.trim() ||
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!raw) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }

  return `https://${raw.replace(/\/$/, "")}`;
}
