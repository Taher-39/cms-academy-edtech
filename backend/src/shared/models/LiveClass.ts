import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const LiveClassSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    dateTime: { type: Date, required: true },
    meetLink: { type: String, required: true },
    recordedLecture: { type: Schema.Types.ObjectId, ref: "Lecture", required: false },
  },
  { timestamps: true }
);

export type LiveClass = InferSchemaType<typeof LiveClassSchema>;
export const LiveClassModel =
  mongoose.models.LiveClass || mongoose.model("LiveClass", LiveClassSchema);
