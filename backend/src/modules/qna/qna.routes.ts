import { Router } from "express";
import multer from "multer";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as qnaController from "./qna.controller";
import cloudinary from "../../shared/config/cloudinary";

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

// Upload QnA image (student or teacher)
router.post("/upload-image", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "ছবি ফাইল প্রয়োজন" });
    }
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "cms-academy/qna-images" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result as { secure_url: string });
        }
      );
      stream.end(req.file!.buffer);
    });
    res.json({ url: result.secure_url });
  } catch (err: any) {
    res.status(500).json({ message: "ছবি আপলোড ব্যর্থ: " + err.message });
  }
});

router.post("/:qnaId/answer", authMiddleware, requireRole("admin", "superAdmin", "teacher"), qnaController.answerQuestion);

export default router;
