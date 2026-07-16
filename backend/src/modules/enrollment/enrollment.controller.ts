import { Request, Response } from "express";
import * as enrollmentService from "./enrollment.service";
import { enrollSchema, grantAccessSchema } from "./enrollment.validation";

export async function enroll(req: Request, res: Response) {
  try {
    const parsed = enrollSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await enrollmentService.enrollStudent(
      req.user!.userId,
      parsed.data.courseId
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Enroll error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function getEnrollments(req: Request, res: Response) {
  try {
    const result = await enrollmentService.getUserEnrollments(req.user!.userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get enrollments error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function checkAccess(req: Request, res: Response) {
  try {
    const result = await enrollmentService.checkAccess(
      req.user!.userId,
      req.params.courseId,
      req.user!.role
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Access check error:", error);
    return res.status(200).json({ hasAccess: false });
  }
}

export async function markWatchedHandler(req: Request, res: Response) {
  try {
    const lectureId = req.body?.lectureId as string;
    if (!lectureId) {
      return res.status(400).json({ message: "lectureId আবশ্যক" });
    }
    const result = await enrollmentService.markLectureWatched(
      req.user!.userId,
      req.params.courseId,
      lectureId
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Mark watched error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function getAllEnrollmentsHandler(req: Request, res: Response) {
  try {
    const result = await enrollmentService.getAllEnrollments({
      page: parseInt((req.query.page as string) || "1"),
      limit: parseInt((req.query.limit as string) || "20"),
      paymentStatus: req.query.paymentStatus as string,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get all enrollments error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function grantFreeAccessHandler(req: Request, res: Response) {
  try {
    const parsed = grantAccessSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await enrollmentService.grantFreeAccess(
      parsed.data.userId,
      parsed.data.courseId,
      req.user!.userId
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Grant free access error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function listGrantedAccessHandler(_req: Request, res: Response) {
  try {
    const result = await enrollmentService.listGrantedAccess();
    return res.status(200).json(result);
  } catch (error) {
    console.error("List granted access error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function revokeFreeAccessHandler(req: Request, res: Response) {
  try {
    const result = await enrollmentService.revokeFreeAccess(req.params.id);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Revoke free access error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function refundEnrollmentHandler(req: Request, res: Response) {
  try {
    const remarks = (req.body?.remarks as string) || "Admin initiated refund";
    const result = await enrollmentService.refundEnrollment(req.params.id, remarks);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Refund error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
