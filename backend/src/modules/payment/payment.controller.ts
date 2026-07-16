import { Request, Response } from "express";
import * as paymentService from "./payment.service";
import { paymentInitSchema } from "./payment.validation";

export async function initPayment(req: Request, res: Response) {
  try {
    const parsed = paymentInitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await paymentService.initPayment(
      req.user!.userId,
      req.user!.email || "",
      parsed.data.courseId,
      parsed.data.couponCode
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Payment init error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function handleIpn(req: Request, res: Response) {
  try {
    const result = await paymentService.handleIpn(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error("IPN error:", error);
    return res.status(200).json({ message: "IPN processing failed" });
  }
}

export async function handleSuccess(req: Request, res: Response) {
  try {
    const result = await paymentService.handlePaymentSuccess({ ...req.query, ...req.body });
    return res.redirect(result.redirect);
  } catch (error) {
    console.error("Payment success error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/payment/failed`);
  }
}

export async function handleFail(req: Request, res: Response) {
  const courseId = req.query.courseId;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return res.redirect(`${frontendUrl}/courses/${courseId || ""}?payment=failed`);
}

export async function handleCancel(req: Request, res: Response) {
  const courseId = req.query.courseId;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return res.redirect(`${frontendUrl}/courses/${courseId || ""}?payment=cancelled`);
}
