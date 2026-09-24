import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const CertificateSchema = new Schema(
  {
    // Human-readable public id printed on the certificate, e.g. "CMS-2026-4F9A2B".
    certificateId: { type: String, required: true, unique: true, trim: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true },
    studentName: { type: String, required: true, trim: true },
    courseTitle: { type: String, required: true, trim: true },
    teacherName: { type: String, required: false, trim: true },
    lecturesCompleted: { type: Number, required: true, default: 0 },
    totalLectures: { type: Number, required: true, default: 0 },
    issuedAt: { type: Date, required: true, default: () => new Date() },
    revokedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

CertificateSchema.index({ student: 1, course: 1 }, { unique: true });

export type Certificate = InferSchemaType<typeof CertificateSchema>;
export const CertificateModel =
  mongoose.models.Certificate || mongoose.model("Certificate", CertificateSchema);
