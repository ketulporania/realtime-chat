import { Router } from "express";
import {
  listRooms,
  createRoom,
  getRoom,
  joinRoom,
  getMessages,
} from "../controllers/rooms.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(listRooms));
router.post("/", asyncHandler(createRoom));
router.get("/:roomId", asyncHandler(getRoom));
router.post("/:roomId/join", asyncHandler(joinRoom));
router.get("/:roomId/messages", asyncHandler(getMessages));

export default router;
