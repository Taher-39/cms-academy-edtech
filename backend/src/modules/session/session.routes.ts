import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as sessionController from "./session.controller";

const router = Router();

router.get("/teachers", authMiddleware, sessionController.listTeachers);
router.post("/init", authMiddleware, requireRole("student"), sessionController.initBooking);
router.post("/manual-init", authMiddleware, requireRole("student"), sessionController.manualInitBooking);
router.get("/mine", authMiddleware, sessionController.listMine);
router.post("/:sessionId/accept", authMiddleware, requireRole("teacher"), sessionController.accept);
router.post("/:sessionId/decline", authMiddleware, requireRole("teacher"), sessionController.decline);
router.post("/:sessionId/cancel", authMiddleware, sessionController.cancel);
router.post("/:sessionId/complete", authMiddleware, sessionController.complete);

export default router;
