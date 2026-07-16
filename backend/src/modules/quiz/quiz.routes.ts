import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as quizController from "./quiz.controller";

const router = Router();

const canManage = [authMiddleware, requireRole("teacher", "admin", "superAdmin")];

// Chapters (with question counts + marking/timing rules) — shared by admin picker and student picker
router.get("/:courseId/chapters", authMiddleware, quizController.listChapters);

// Management (AI generation + manual CRUD)
router.post("/:courseId/generate", ...canManage, quizController.generateQuestions);
router.get("/:courseId/questions", ...canManage, quizController.listQuestions);
router.post("/:courseId/questions", ...canManage, quizController.createQuestion);
router.put("/:courseId/questions/:questionId", ...canManage, quizController.updateQuestion);
router.delete("/:courseId/questions/:questionId", ...canManage, quizController.deleteQuestion);

// Student attempts
router.post("/:courseId/attempts", authMiddleware, quizController.startAttempt);
router.get("/:courseId/attempts", authMiddleware, quizController.listAttempts);
router.get("/:courseId/attempts/:attemptId", authMiddleware, quizController.getAttempt);
router.post("/:courseId/attempts/:attemptId/submit", authMiddleware, quizController.submitAttempt);

export default router;
