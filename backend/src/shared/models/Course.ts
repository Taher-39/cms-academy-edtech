import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const courseCategories = ["academic", "job"] as const;
export type CourseCategory = (typeof courseCategories)[number];

export const classLevels = ["6-8", "9-10", "11-12", "job"] as const;
export type ClassLevel = (typeof classLevels)[number];

export const courseTypes = ["full", "revision", "mcq", "chapter"] as const;
export type CourseType = (typeof courseTypes)[number];

export const courseStatuses = ["pending", "approved", "rejected"] as const;
export type CourseStatus = (typeof courseStatuses)[number];

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, enum: courseCategories },
    classLevel: { type: String, required: true, enum: classLevels },
    subject: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: courseTypes },
    price: { type: Number, required: true, default: 0, min: 0 },
    regularPrice: { type: Number, required: false, min: 0 },
    discountPercent: { type: Number, required: false, default: 0, min: 0, max: 100 },
    enrollStartDate: { type: Date, required: false },
    enrollEndDate: { type: Date, required: false },
    courseDurationDays: { type: Number, required: true, default: 180, min: 1 },
    thumbnail: { type: String, required: false },
    outline: { type: String, required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isLive: { type: Boolean, required: true, default: false },
    liveMeetingLink: { type: String, required: false },
    lectures: [{ type: Schema.Types.ObjectId, ref: "Lecture" }],
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: courseStatuses, required: true, default: "approved" },
    isFeatured: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

CourseSchema.pre("save", function () {
  const doc = this as unknown as { regularPrice?: number; price: number; discountPercent: number };
  if (doc.regularPrice && doc.regularPrice > doc.price) {
    doc.discountPercent = Math.round(
      ((doc.regularPrice - doc.price) / doc.regularPrice) * 100
    );
  }
});

export type Course = InferSchemaType<typeof CourseSchema>;
export const CourseModel = mongoose.models.Course || mongoose.model("Course", CourseSchema);
