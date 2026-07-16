import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

export type Category = InferSchemaType<typeof CategorySchema>;
export const CategoryModel =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);
