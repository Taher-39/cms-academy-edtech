import { z } from "zod";

export const paymentInitSchema = z.object({
  courseId: z.string().min(1, "courseId প্রদান করুন"),
  couponCode: z.string().optional(),
});
