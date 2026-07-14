import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as settingsController from "./settings.controller";

const router = Router();

router.get("/", settingsController.getSettings);
router.put("/", authMiddleware, requireRole("superAdmin"), settingsController.updateSettings);

export default router;
