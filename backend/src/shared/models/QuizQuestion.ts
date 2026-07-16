import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const QuizQuestionSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    chapter: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length >= 2 && v.length <= 6,
        message: "প্রতিটি প্রশ্নে ২ থেকে ৬টি অপশন থাকতে হবে",
      },
    },
    correctOptionIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, required: false, trim: true, default: "" },
    order: { type: Number, required: true, default: 0 },
    source: { type: String, enum: ["ai", "manual"], required: true, default: "manual" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

QuizQuestionSchema.index({ course: 1, chapter: 1, order: 1 });

export type QuizQuestion = InferSchemaType<typeof QuizQuestionSchema>;
export const QuizQuestionModel =
  mongoose.models.QuizQuestion || mongoose.model("QuizQuestion", QuizQuestionSchema);
