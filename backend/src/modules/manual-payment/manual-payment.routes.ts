import { Router } from "express";
import multer from "multer";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as manualPaymentController from "./manual-payment.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for screenshots
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("শুধুমাত্র ছবি ফাইল আপলোড করা যাবে"));
    }
    cb(null, true);
  },
});

// Student: upload payment screenshot
router.post("/upload-screenshot", authMiddleware, upload.single("file"), manualPaymentController.uploadScreenshot);

// Student: submit manual payment
router.post("/submit", authMiddleware, manualPaymentController.submitPayment);

// Admin: list manual payments
router.get("/", authMiddleware, requireRole("admin", "superAdmin"), manualPaymentController.listPayments);

// Admin: pending count
router.get("/pending-count", authMiddleware, requireRole("admin", "superAdmin"), manualPaymentController.pendingCount);

// Admin: approve/reject
router.put("/:id/review", authMiddleware, requireRole("admin", "superAdmin"), manualPaymentController.reviewPayment);

export default router;
