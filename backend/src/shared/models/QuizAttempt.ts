import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const quizAttemptStatuses = ["in-progress", "submitted"] as const;
export type QuizAttemptStatus = (typeof quizAttemptStatuses)[number];

// Each question is snapshotted at attempt-start time so that later edits/deletes
// to the QuizQuestion bank never change the questions or explanations shown for
// a past attempt.
const AttemptQuestionSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, ref: "QuizQuestion", required: false },
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String, required: false, default: "" },
    selectedOptionIndex: { type: Number, required: false, default: null },
    isCorrect: { type: Boolean, required: false, default: null },
    marksAwarded: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    chapter: { type: String, required: true, trim: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: ["academic", "job"], required: true },
    negativeMarkPerWrong: { type: Number, required: true, default: 0 },
    timePerQuestionSec: { type: Number, required: true },
    totalTimeAllowedSec: { type: Number, required: true },
    questions: { type: [AttemptQuestionSchema], required: true },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true, default: 0 },
    wrongCount: { type: Number, required: true, default: 0 },
    unansweredCount: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: false, default: null },
    timeTakenSec: { type: Number, required: false, default: null },
    status: { type: String, enum: quizAttemptStatuses, required: true, default: "in-progress" },
    startedAt: { type: Date, required: true, default: () => new Date() },
    submittedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ student: 1, course: 1, chapter: 1, createdAt: -1 });

export type QuizAttempt = InferSchemaType<typeof QuizAttemptSchema>;
export const QuizAttemptModel =
  mongoose.models.QuizAttempt || mongoose.model("QuizAttempt", QuizAttemptSchema);
