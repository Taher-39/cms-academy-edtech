import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import * as authController from "./auth.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("শুধুমাত্র ছবি ফাইল আপলোড করা যাবে"));
    }
    cb(null, true);
  },
});

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtpHandler);
router.post("/login", authController.login);
router.post("/google", authController.googleAuthHandler);
router.post("/forgot-password", authController.forgotPasswordHandler);
router.post("/reset-password", authController.resetPasswordHandler);
router.post("/change-password", authMiddleware, authController.changePasswordHandler);
router.put("/me", authMiddleware, authController.updateProfileHandler);
router.post("/avatar", authMiddleware, upload.single("avatar"), authController.uploadAvatarHandler);

export default router;
