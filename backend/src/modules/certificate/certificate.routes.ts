import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as certificateController from "./certificate.controller";

const router = Router();

// Public verification — anyone holding a certificate id can check it.
router.get("/verify/:certificateId", certificateController.verify);

router.get("/mine", authMiddleware, certificateController.listMine);
router.post("/claim/:courseId", authMiddleware, certificateController.claim);

router.get(
  "/admin/all",
  authMiddleware,
  requireRole("admin", "superAdmin"),
  certificateController.listAll
);
router.patch(
  "/admin/:id/revoke",
  authMiddleware,
  requireRole("admin", "superAdmin"),
  certificateController.setRevoked
);

export default router;
