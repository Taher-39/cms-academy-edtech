import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    // Admins can hide an abusive review without deleting the student's record.
    isHidden: { type: Boolean, required: true, default: false },
    hiddenBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

// One review per student per course — writing again edits the existing one.
ReviewSchema.index({ course: 1, student: 1 }, { unique: true });
ReviewSchema.index({ course: 1, isHidden: 1, createdAt: -1 });

export type Review = InferSchemaType<typeof ReviewSchema>;
export const ReviewModel = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
