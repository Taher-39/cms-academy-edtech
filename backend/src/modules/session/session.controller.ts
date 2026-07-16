import { Request, Response } from "express";
import * as sessionService from "./session.service";
import { initSessionSchema, acceptSessionSchema, declineSessionSchema } from "./session.validation";

function handleError(res: Response, error: any, fallback = "সার্ভার ত্রুটি") {
  if (error?.status) return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: fallback });
}

export async function listTeachers(_req: Request, res: Response) {
  try {
    const result = await sessionService.listTeachers();
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function initBooking(req: Request, res: Response) {
  try {
    const parsed = initSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await sessionService.initBooking(req.user!.userId, req.user!.email || "", parsed.data);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const result = await sessionService.listMine(req.user!.userId, req.user!.role || "");
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function accept(req: Request, res: Response) {
  try {
    const parsed = acceptSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await sessionService.acceptSession(
      req.params.sessionId,
      req.user!.userId,
      parsed.data.meetLink
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function decline(req: Request, res: Response) {
  try {
    const parsed = declineSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((e) => e.message).join(", ") });
    }
    const result = await sessionService.declineSession(
      req.params.sessionId,
      req.user!.userId,
      parsed.data.note
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function cancel(req: Request, res: Response) {
  try {
    const result = await sessionService.cancelSession(
      req.params.sessionId,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function complete(req: Request, res: Response) {
  try {
    const result = await sessionService.markCompleted(
      req.params.sessionId,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}
