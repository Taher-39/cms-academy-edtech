import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const couponTypes = ["flat", "percent"] as const;
export type CouponType = (typeof couponTypes)[number];

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, required: true, enum: couponTypes },
    discountAmount: { type: Number, required: true, min: 0 },
    validTill: { type: Date, required: true },
    usageLimit: { type: Number, required: true, min: 1 },
    usedCount: { type: Number, required: true, default: 0, min: 0 },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export type Coupon = InferSchemaType<typeof CouponSchema>;
export const CouponModel = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
