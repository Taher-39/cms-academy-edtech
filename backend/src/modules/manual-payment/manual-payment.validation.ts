import { z } from "zod";
import { manualPaymentMethods } from "../../shared/models/ManualPayment";

export const manualPaymentInitSchema = z.object({
  courseId: z.string().min(1, "কোর্স ID প্রয়োজন"),
  phoneNumber: z
    .string()
    .min(10, "ফোন নাম্বার অন্তত ১০ ডিজিট হতে হবে")
    .max(14, "ফোন নাম্বার ১৪ ডিজিটের বেশি হতে পারবে না")
    .regex(/^01\d+$/, "বাংলাদেশী মোবাইল নাম্বার হতে হবে (01XXXXXXXXX)"),
  paymentMethod: z.enum(manualPaymentMethods, {
    message: "bKash, Nagad অথবা Rocket সিলেক্ট করুন",
  }),
  screenshot: z.string().optional(),
});

export const adminReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().optional(),
});
