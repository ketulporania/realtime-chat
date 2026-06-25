import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
} from "../controllers/auth.controller";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", authMiddleware, asyncHandler(logout));
router.get("/me", optionalAuthMiddleware, asyncHandler(me));

export default router;
