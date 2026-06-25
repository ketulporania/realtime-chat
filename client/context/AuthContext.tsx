"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch, User } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  /** Restore session from cookie — call only on protected routes or home redirect. */
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const data = await apiFetch<{ user: User | null }>("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await apiFetch<{ message: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    const session = await apiFetch<{ user: User | null }>("/api/auth/me");
    if (!session.user) {
      setUser(null);
      throw new Error("Session could not be established. Please try again.");
    }
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear local session even if the request fails
    } finally {
      disconnectSocket();
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, login, register, logout, refreshUser }),
    [user, login, register, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
