import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as qnaController from "./qna.controller";

const router = Router();

router.post("/:qnaId/answer", authMiddleware, requireRole("admin", "superAdmin", "teacher"), qnaController.answerQuestion);

export default router;
