import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "রেটিং দিন").max(5, "রেটিং সর্বোচ্চ ৫"),
  comment: z.string().min(3, "মন্তব্য লিখুন").max(1000, "মন্তব্য সর্বোচ্চ ১০০০ অক্ষর"),
});

export const visibilitySchema = z.object({
  isHidden: z.boolean(),
});
