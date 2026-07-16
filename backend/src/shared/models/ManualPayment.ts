import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const manualPaymentMethods = ["bKash", "Nagad", "Rocket"] as const;
export type ManualPaymentMethod = (typeof manualPaymentMethods)[number];

export const manualPaymentStatuses = ["pending", "approved", "rejected"] as const;
export type ManualPaymentStatus = (typeof manualPaymentStatuses)[number];

const ManualPaymentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    phoneNumber: { type: String, required: true, trim: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: manualPaymentMethods,
    },
    amount: { type: Number, required: true },
    screenshot: { type: String, required: false },
    status: {
      type: String,
      required: true,
      enum: manualPaymentStatuses,
      default: "pending",
    },
    adminNotes: { type: String, required: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    reviewedAt: { type: Date, required: false },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment", required: false },
  },
  { timestamps: true }
);

export type ManualPayment = InferSchemaType<typeof ManualPaymentSchema>;
export const ManualPaymentModel =
  mongoose.models.ManualPayment || mongoose.model("ManualPayment", ManualPaymentSchema);
