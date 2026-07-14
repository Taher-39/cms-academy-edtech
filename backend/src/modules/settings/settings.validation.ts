import { z } from "zod";

const bannerSchema = z.object({
  image: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  link: z.string().optional(),
  order: z.number().default(0),
});

const faqSchema = z.object({
  question: z.string().min(1, "প্রশ্ন আবশ্যক"),
  answer: z.string().min(1, "উত্তর আবশ্যক"),
  order: z.number().default(0),
});

export const updateSettingsSchema = z.object({
  banners: z.array(bannerSchema).optional(),
  faqs: z.array(faqSchema).optional(),
  termsContent: z.string().optional(),
});
