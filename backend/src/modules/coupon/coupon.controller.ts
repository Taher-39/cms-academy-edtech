import { Request, Response } from "express";
import * as couponService from "./coupon.service";
import { createCouponSchema, updateCouponSchema } from "./coupon.validation";

export async function createCoupon(req: Request, res: Response) {
  try {
    const parsed = createCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await couponService.createCoupon(parsed.data, req.user!.userId);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Create coupon error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function listCoupons(_req: Request, res: Response) {
  try {
    const result = await couponService.listCoupons();
    return res.status(200).json(result);
  } catch (error) {
    console.error("List coupons error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function updateCoupon(req: Request, res: Response) {
  try {
    const parsed = updateCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await couponService.updateCoupon(req.params.couponId, parsed.data);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update coupon error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function deleteCoupon(req: Request, res: Response) {
  try {
    const result = await couponService.deleteCoupon(req.params.couponId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Delete coupon error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
