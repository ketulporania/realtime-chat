export interface User {
  id: string;
  username: string;
  email: string;
  avatarColor: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  memberCount: number;
  isMember: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  username: string;
  roomId: string;
  createdAt: string;
  avatarColor?: string;
}

export interface UserProfile {
  username: string;
  avatarColor: string;
}

import { getApiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[] | undefined>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error ?? "Request failed",
      data.details
    );
  }

  return data as T;
}
