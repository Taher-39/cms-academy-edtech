import mongoose, { InferSchemaType } from "mongoose";
import type { Course } from "./Course";

const { Schema } = mongoose;

export const paymentStatuses = ["paid", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

const EnrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    enrolledAt: { type: Date, required: true, default: () => new Date() },
    expiryAt: { type: Date, required: false },
    discountApplied: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0, min: 0 },
    transactionId: { type: String, required: false },
    valId: { type: String, required: false },
    bankTransactionId: { type: String, required: false },
    couponCode: { type: String, required: false },
    paymentStatus: { type: String, enum: paymentStatuses, required: true, default: "paid" },
    refundedAt: { type: Date, required: false },
    refundAmount: { type: Number, required: false },
    refundRemarks: { type: String, required: false },
    refundRefId: { type: String, required: false },
    watchedLectures: [{ type: Schema.Types.ObjectId, ref: "Lecture" }],
  },
  { timestamps: true }
);

EnrollmentSchema.pre("save", async function () {
  const doc = this as unknown as { expiryAt?: Date; course: unknown };
  if (!doc.expiryAt) {
    try {
      const CourseModel = mongoose.model<Course>("Course");
      const course = await CourseModel.findById(doc.course).select("courseDurationDays").lean();
      const durationDays = (course as { courseDurationDays?: number } | null)?.courseDurationDays ?? 180;
      const d = new Date();
      d.setDate(d.getDate() + durationDays);
      doc.expiryAt = d;
    } catch {
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      doc.expiryAt = d;
    }
  }
});

export type Enrollment = InferSchemaType<typeof EnrollmentSchema>;
export const EnrollmentModel =
  mongoose.models.Enrollment || mongoose.model("Enrollment", EnrollmentSchema);
