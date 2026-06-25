import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken, COOKIE_NAME, getCookieOptions } from "../utils/jwt";

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username may only contain letters, numbers, and underscores"
    ),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be at most 128 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function sanitizeUser(user: {
  id: string;
  username: string;
  email: string;
  avatarColor: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
  };
}

function setAuthCookie(res: Response, userId: string): void {
  const token = signToken(userId);
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    const field = existing.email === email ? "email" : "username";
    res.status(409).json({ error: `${field} already in use` });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const avatarColor =
    AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const user = await prisma.user.create({
    data: { username, email, passwordHash, avatarColor },
  });

  res.status(201).json({
    message: "Account created successfully",
    user: sanitizeUser(user),
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  setAuthCookie(res, user.id);
  res.json({ user: sanitizeUser(user) });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  const { maxAge: _maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie(COOKIE_NAME, clearOptions);
  res.json({ message: "Logged out successfully" });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.userId) {
    res.json({ user: null });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    res.json({ user: null });
    return;
  }

  res.json({ user: sanitizeUser(user) });
}
