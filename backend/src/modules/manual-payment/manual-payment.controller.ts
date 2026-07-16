import type { Request, Response } from "express";
import { manualPaymentInitSchema, adminReviewSchema } from "./manual-payment.validation";
import * as manualPaymentService from "./manual-payment.service";
import cloudinary from "../../shared/config/cloudinary";

export async function uploadScreenshot(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "ছবি ফাইল প্রয়োজন" });
    }

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "cms-academy/payment-screenshots" },
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
}

export async function submitPayment(req: Request, res: Response) {
  try {
    const body = manualPaymentInitSchema.parse(req.body);
    const userId = (req as any).user._id;

    const result = await manualPaymentService.submitManualPayment({
      userId,
      courseId: body.courseId,
      phoneNumber: body.phoneNumber,
      paymentMethod: body.paymentMethod,
      screenshot: body.screenshot,
    });

    res.status(201).json(result);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({ message: err.errors?.[0]?.message || "ইনপুট সঠিক নয়" });
    }
    const status = err.message?.includes("ইতিমধ্যে") ? 409 : 400;
    res.status(status).json({ message: err.message || "পেমেন্ট সাবমিট করতে সমস্যা হয়েছে" });
  }
}

export async function listPayments(req: Request, res: Response) {
  try {
    const { status, page, limit } = req.query;
    const result = await manualPaymentService.listManualPayments({
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function pendingCount(req: Request, res: Response) {
  try {
    const count = await manualPaymentService.countPendingManualPayments();
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function reviewPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = adminReviewSchema.parse(req.body);
    const reviewerId = (req as any).user._id;

    const result = await manualPaymentService.reviewManualPayment(id, reviewerId, body);
    res.json(result);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({ message: err.errors?.[0]?.message || "ইনপুট সঠিক নয়" });
    }
    res.status(400).json({ message: err.message });
  }
}
