import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as analyticsController from "./analytics.controller";

const router = Router();

router.use(authMiddleware, requireRole("admin", "superAdmin"));

router.get("/summary", analyticsController.getSummary);
router.get("/top-courses", analyticsController.getTopCourses);
router.get("/revenue-trend", analyticsController.getRevenueTrend);

export default router;
