import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const notificationTypes = [
  "enrollment",
  "payment",
  "qna",
  "live",
  "session",
  "course",
  "certificate",
  "review",
  "system",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: notificationTypes, required: true, default: "system" },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    // In-app path the bell item links to, e.g. "/dashboard/sessions".
    link: { type: String, required: false, trim: true },
    isRead: { type: Boolean, required: true, default: false },
    readAt: { type: Date, required: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
// Notifications are transient — drop them 90 days after creation.
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export type Notification = InferSchemaType<typeof NotificationSchema>;
export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
