import { Request, Response } from "express";
import * as reviewService from "./review.service";
import { reviewSchema, visibilitySchema } from "./review.validation";

function handleError(res: Response, error: any, fallback = "সার্ভার ত্রুটি") {
  if (error?.status) return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: fallback });
}

function pageParams(req: Request, defaultLimit = 10) {
  return {
    page: Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1),
    limit: Math.min(
      50,
      Math.max(1, parseInt(String(req.query.limit ?? defaultLimit), 10) || defaultLimit)
    ),
  };
}

export async function listCourseReviews(req: Request, res: Response) {
  try {
    const { page, limit } = pageParams(req);
    const result = await reviewService.listCourseReviews(
      req.params.courseId,
      page,
      limit,
      req.user ? { userId: req.user.userId, role: req.user.role } : undefined
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function eligibility(req: Request, res: Response) {
  try {
    const result = await reviewService.getReviewEligibility(req.params.courseId, req.user!.userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function upsertReview(req: Request, res: Response) {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await reviewService.upsertReview(
      req.params.courseId,
      req.user!.userId,
      parsed.data
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    const result = await reviewService.deleteReview(
      req.params.id,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function listAllReviews(req: Request, res: Response) {
  try {
    const { page, limit } = pageParams(req, 20);
    const result = await reviewService.listAllReviews({
      page,
      limit,
      hidden: req.query.hidden ? String(req.query.hidden) : undefined,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function setVisibility(req: Request, res: Response) {
  try {
    const parsed = visibilitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await reviewService.setReviewVisibility(
      req.params.id,
      parsed.data.isHidden,
      req.user!.userId
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}
