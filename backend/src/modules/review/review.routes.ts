import { Router } from "express";
import {
  authMiddleware,
  optionalAuth,
  requireRole,
} from "../../shared/middleware/auth.middleware";
import * as reviewController from "./review.controller";

const router = Router();

// Admin moderation — declared before "/:courseId" style paths so "admin" isn't
// swallowed as a course id.
router.get(
  "/admin/all",
  authMiddleware,
  requireRole("admin", "superAdmin"),
  reviewController.listAllReviews
);
router.patch(
  "/admin/:id/visibility",
  authMiddleware,
  requireRole("admin", "superAdmin"),
  reviewController.setVisibility
);

router.get("/course/:courseId", optionalAuth, reviewController.listCourseReviews);
router.get("/course/:courseId/eligibility", authMiddleware, reviewController.eligibility);
router.post("/course/:courseId", authMiddleware, reviewController.upsertReview);
router.delete("/:id", authMiddleware, reviewController.deleteReview);

export default router;
