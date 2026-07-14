import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const LectureSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: false },
    videoUrl: { type: String, required: false },
    noteUrl: { type: String, required: false },
    order: { type: Number, required: true, min: 0 },
    isFree: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export type Lecture = InferSchemaType<typeof LectureSchema>;
export const LectureModel = mongoose.models.Lecture || mongoose.model("Lecture", LectureSchema);
