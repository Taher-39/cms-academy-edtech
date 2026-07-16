import { Request, Response } from "express";
import * as quizService from "./quiz.service";
import {
  generateQuestionsSchema,
  questionInputSchema,
  updateQuestionSchema,
  startAttemptSchema,
  submitAttemptSchema,
} from "./quiz.validation";

function handleError(res: Response, error: any, fallback = "সার্ভার ত্রুটি") {
  if (error?.status) return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: fallback });
}

// ============ Management ============

export async function generateQuestions(req: Request, res: Response) {
  try {
    const parsed = generateQuestionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await quizService.generateAndSaveQuestions(
      req.params.courseId,
      req.user!.userId,
      req.user!.role || "",
      parsed.data
    );
    return res.status(201).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function listChapters(req: Request, res: Response) {
  try {
    const result = await quizService.listChapters(req.params.courseId);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function listQuestions(req: Request, res: Response) {
  try {
    const result = await quizService.listQuestions(
      req.params.courseId,
      req.query.chapter as string | undefined,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function createQuestion(req: Request, res: Response) {
  try {
    const parsed = questionInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await quizService.createQuestion(
      req.params.courseId,
      parsed.data,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(201).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function updateQuestion(req: Request, res: Response) {
  try {
    const parsed = updateQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await quizService.updateQuestion(
      req.params.courseId,
      req.params.questionId,
      parsed.data,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function deleteQuestion(req: Request, res: Response) {
  try {
    const result = await quizService.deleteQuestion(
      req.params.courseId,
      req.params.questionId,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

// ============ Student attempts ============

export async function startAttempt(req: Request, res: Response) {
  try {
    const parsed = startAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await quizService.startAttempt(
      req.params.courseId,
      parsed.data.chapter,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(201).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function submitAttempt(req: Request, res: Response) {
  try {
    const parsed = submitAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await quizService.submitAttempt(
      req.params.attemptId,
      req.user!.userId,
      parsed.data.answers
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function getAttempt(req: Request, res: Response) {
  try {
    const result = await quizService.getAttempt(
      req.params.attemptId,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function listAttempts(req: Request, res: Response) {
  try {
    const result = await quizService.listAttempts(
      req.params.courseId,
      req.query.chapter as string | undefined,
      req.user!.userId
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}
