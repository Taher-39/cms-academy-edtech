import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const AnswerSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reply: { type: String, required: true },
    date: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false }
);

const QnASchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    answers: { type: [AnswerSchema], required: true, default: [] },
  },
  { timestamps: true }
);

export type QnA = InferSchemaType<typeof QnASchema>;
export const QnAModel = mongoose.models.QnA || mongoose.model("QnA", QnASchema);
