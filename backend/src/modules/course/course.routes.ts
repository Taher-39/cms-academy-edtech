import { Router } from "express";
import multer from "multer";
import { authMiddleware, optionalAuth, requireRole } from "../../shared/middleware/auth.middleware";
import * as courseController from "./course.controller";

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

// Courses
router.get("/", optionalAuth, courseController.listCourses);
router.post(
  "/thumbnail",
  authMiddleware,
  requireRole("admin", "superAdmin", "teacher"),
  upload.single("thumbnail"),
  courseController.uploadThumbnail
);
router.get("/:courseId", courseController.getCourseById);
router.post("/", authMiddleware, requireRole("admin", "superAdmin", "teacher"), courseController.createCourse);
router.put("/:courseId", authMiddleware, courseController.updateCourse);
router.delete("/:courseId", authMiddleware, courseController.deleteCourse);

// Lectures
router.get("/:courseId/lectures", optionalAuth, courseController.listLectures);
router.post("/:courseId/lectures", authMiddleware, courseController.createLecture);
router.put("/:courseId/lectures/:lectureId", authMiddleware, courseController.updateLecture);
router.delete("/:courseId/lectures/:lectureId", authMiddleware, courseController.deleteLecture);

// Live Classes
router.get("/:courseId/live", courseController.listLiveClasses);
router.post("/:courseId/live", authMiddleware, courseController.createLiveClass);

// Q&A
router.get("/:courseId/qna", authMiddleware, courseController.listQnA);
router.post("/:courseId/qna", authMiddleware, courseController.askQuestion);

export default router;
