import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import * as paymentController from "./payment.controller";

const router = Router();

router.post("/init", authMiddleware, paymentController.initPayment);
router.post("/ipn", paymentController.handleIpn);
router.get("/success", paymentController.handleSuccess);
router.get("/fail", paymentController.handleFail);
router.get("/cancel", paymentController.handleCancel);

export default router;
