import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import * as notificationController from "./notification.controller";

const router = Router();

router.get("/", authMiddleware, notificationController.list);
router.get("/unread-count", authMiddleware, notificationController.unreadCount);
router.post("/read-all", authMiddleware, notificationController.markAllRead);
router.delete("/clear", authMiddleware, notificationController.clearAll);
router.post("/:id/read", authMiddleware, notificationController.markRead);
router.delete("/:id", authMiddleware, notificationController.remove);

export default router;
