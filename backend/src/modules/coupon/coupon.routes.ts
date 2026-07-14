import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as couponController from "./coupon.controller";

const router = Router();

router.get("/", authMiddleware, requireRole("admin", "superAdmin"), couponController.listCoupons);
router.post("/", authMiddleware, requireRole("admin", "superAdmin"), couponController.createCoupon);
router.put("/:couponId", authMiddleware, requireRole("admin", "superAdmin"), couponController.updateCoupon);
router.delete("/:couponId", authMiddleware, requireRole("admin", "superAdmin"), couponController.deleteCoupon);

export default router;
