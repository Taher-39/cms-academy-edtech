import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./modules/auth/auth.routes";
import courseRoutes from "./modules/course/course.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";
import paymentRoutes from "./modules/payment/payment.routes";
import qnaRoutes from "./modules/qna/qna.routes";
import liveRoutes from "./modules/live/live.routes";
import contactRoutes from "./modules/contact/contact.routes";
import adminRoutes from "./modules/auth/admin.routes";
import couponRoutes from "./modules/coupon/coupon.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import categoryRoutes from "./modules/category/category.routes";
import assistantRoutes from "./modules/assistant/assistant.routes";

function frontendOrigins(): string[] {
  return (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const app = express();

// ---------- Middleware ----------
app.use(cors({ origin: frontendOrigins(), credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/enroll", enrollmentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/qna", qnaRoutes);
app.use("/api/live", liveRoutes);
app.use("/api/auth", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/assistant", assistantRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------- 404 Handler ----------
app.use((_req, res) => {
  res.status(404).json({ message: "API রুট পাওয়া যায়নি" });
});

// ---------- Global Error Handler ----------
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "সার্ভার ত্রুটি" });
});

export default app;
