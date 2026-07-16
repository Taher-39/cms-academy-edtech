import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import * as paymentController from "./payment.controller";

const router = Router();

router.post("/init", authMiddleware, paymentController.initPayment);
router.post("/ipn", paymentController.handleIpn);
// SSLCommerz calls success/fail/cancel URLs via POST, not GET
router.route("/success").get(paymentController.handleSuccess).post(paymentController.handleSuccess);
router.route("/fail").get(paymentController.handleFail).post(paymentController.handleFail);
router.route("/cancel").get(paymentController.handleCancel).post(paymentController.handleCancel);

export default router;
