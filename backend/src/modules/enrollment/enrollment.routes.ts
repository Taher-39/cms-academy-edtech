import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as enrollmentController from "./enrollment.controller";

const router = Router();

// POST /api/enroll — enroll in a course
router.post("/", authMiddleware, enrollmentController.enroll);

// GET /api/enrollments — list user's enrollments
router.get("/", authMiddleware, enrollmentController.getEnrollments);

// GET /api/enrollments/admin/all — list all enrollments (admin only)
router.get(
  "/admin/all",
  authMiddleware,
  requireRole("admin", "superAdmin"),
  enrollmentController.getAllEnrollmentsHandler
);

// POST /api/enrollments/admin/:id/refund — refund an enrollment (admin only)
router.post(
  "/admin/:id/refund",
  authMiddleware,
  requireRole("admin", "superAdmin"),
  enrollmentController.refundEnrollmentHandler
);

// POST /api/enrollments/admin/grant — grant an admin free access to a course (superAdmin only)
router.post(
  "/admin/grant",
  authMiddleware,
  requireRole("superAdmin"),
  enrollmentController.grantFreeAccessHandler
);

// GET /api/enrollments/admin/grants — list granted free-access records (superAdmin only)
router.get(
  "/admin/grants",
  authMiddleware,
  requireRole("superAdmin"),
  enrollmentController.listGrantedAccessHandler
);

// DELETE /api/enrollments/admin/grant/:id — revoke a granted free-access record (superAdmin only)
router.delete(
  "/admin/grant/:id",
  authMiddleware,
  requireRole("superAdmin"),
  enrollmentController.revokeFreeAccessHandler
);

// GET /api/enrollments/:courseId/access — check access
router.get("/:courseId/access", authMiddleware, enrollmentController.checkAccess);

// POST /api/enrollments/:courseId/progress — mark a lecture as watched
router.post("/:courseId/progress", authMiddleware, enrollmentController.markWatchedHandler);

export default router;
