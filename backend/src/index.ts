import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDB } from "./shared/lib/db";
import dns from "node:dns/promises";

// Load env vars
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

dns.setServers(["1.1.1.1", "1.0.0.1"]);

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ---------- Middleware ----------
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
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

// ---------- Start Server ----------
async function start() {
  try {
    await connectToDB();
    console.log("✅ Connected to MongoDB");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`Run: netstat -ano | findstr :${PORT}`);
        console.error(`Then: taskkill /PID <PID> /F\n`);
      } else {
        console.error("Server error:", err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
