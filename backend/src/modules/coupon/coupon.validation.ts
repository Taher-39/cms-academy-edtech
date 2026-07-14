import { z } from "zod";

const couponBaseSchema = z.object({
  code: z.string().min(1, "কোড আবশ্যক"),
  type: z.enum(["flat", "percent"]),
  discountAmount: z.number().min(0),
  validTill: z.string().min(1, "মেয়াদ আবশ্যক"),
  usageLimit: z.number().min(1),
  isActive: z.boolean().default(true),
});

function refinePercentCap<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data: any) => data.type !== "percent" || data.discountAmount === undefined || data.discountAmount <= 100,
    { message: "পার্সেন্ট ছাড় ১০০ এর বেশি হতে পারবে না", path: ["discountAmount"] }
  );
}

export const createCouponSchema = refinePercentCap(couponBaseSchema);
export const updateCouponSchema = refinePercentCap(couponBaseSchema.partial());
