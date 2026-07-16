import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const sessionStatuses = [
  "awaiting_teacher",
  "accepted",
  "declined",
  "cancelled",
  "completed",
] as const;
export type SessionStatus = (typeof sessionStatuses)[number];

// A booking is only ever persisted after payment succeeds (mirrors how
// Enrollment rows are only created on a successful course payment) — so
// there is no "unpaid" status here.
const OneToOneSessionSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true },
    topics: { type: String, required: true, trim: true },
    requestedSchedule: { type: Date, required: true },
    durationHours: { type: Number, required: true, min: 1, max: 4, default: 1 },
    pricePerHour: { type: Number, required: true, default: 200 },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: sessionStatuses, required: true, default: "awaiting_teacher" },
    meetLink: { type: String, required: false },
    teacherNote: { type: String, required: false },
    transactionId: { type: String, required: false },
    valId: { type: String, required: false },
    bankTransactionId: { type: String, required: false },
    respondedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

OneToOneSessionSchema.index({ teacher: 1, status: 1 });
OneToOneSessionSchema.index({ student: 1, createdAt: -1 });

export type OneToOneSession = InferSchemaType<typeof OneToOneSessionSchema>;
export const OneToOneSessionModel =
  mongoose.models.OneToOneSession || mongoose.model("OneToOneSession", OneToOneSessionSchema);
