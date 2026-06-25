import type { NextConfig } from "next";
import { resolveBackendUrl } from "./lib/backend-url";

const backendUrl = resolveBackendUrl();

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendUrl) return [];

    return [
      {
        source: "/socket.io/:path*",
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
