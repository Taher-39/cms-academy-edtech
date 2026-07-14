import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const BannerSchema = new Schema(
  {
    image: { type: String, required: false },
    title: { type: String, required: false },
    subtitle: { type: String, required: false },
    link: { type: String, required: false },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const FaqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const SettingsSchema = new Schema(
  {
    banners: { type: [BannerSchema], default: [] },
    faqs: { type: [FaqSchema], default: [] },
    termsContent: { type: String, required: false, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

export type Settings = InferSchemaType<typeof SettingsSchema>;
export const SettingsModel = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
