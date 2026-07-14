import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as liveController from "./live.controller";

const router = Router();

router.put("/:id/record", authMiddleware, requireRole("admin", "superAdmin", "teacher"), liveController.attachRecording);

// Update & Delete live class (admin/superAdmin/teacher)
router.put(
  "/:liveId",
  authMiddleware,
  requireRole("admin", "superAdmin", "teacher"),
  liveController.updateLiveClass
);

router.delete(
  "/:liveId",
  authMiddleware,
  requireRole("admin", "superAdmin", "teacher"),
  liveController.deleteLiveClass
);


export default router;
