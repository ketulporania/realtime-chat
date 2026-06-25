import { Request, Response, NextFunction } from "express";
import { verifyToken, COOKIE_NAME } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Sets req.userId when a valid cookie exists; otherwise continues without error. */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
  } catch {
    // Invalid or expired token — treat as logged out
  }

  next();
}
