import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl } from "@/lib/backend-url";

export const runtime = "nodejs";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function normalizeSetCookie(value: string): string {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter((part) => !part.toLowerCase().startsWith("domain="))
    .join("; ");
}

function getSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const backendUrl = resolveBackendUrl();

  if (!backendUrl) {
    return NextResponse.json(
      {
        error:
          "Server proxy is not configured. Add BACKEND_URL (or NEXT_PUBLIC_API_URL) on Vercel with your Railway URL, then redeploy.",
      },
      { status: 503 }
    );
  }

  const { path } = await context.params;
  const targetUrl = `${backendUrl}/api/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "host") return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, init);
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not reach the backend server. Check BACKEND_URL on Vercel and that Railway is running.",
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();

  backendRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "set-cookie") return;
    responseHeaders.set(key, value);
  });

  const response = new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });

  for (const cookie of getSetCookies(backendRes.headers)) {
    response.headers.append("set-cookie", normalizeSetCookie(cookie));
  }

  return response;
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
