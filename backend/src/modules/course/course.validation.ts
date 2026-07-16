import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(1, "শিরোনাম আবশ্যক"),
  teacher: z.string().min(1, "শিক্ষক নির্বাচন আবশ্যক"),
  description: z.string().min(1, "বিবরণ আবশ্যক"),
  category: z.enum(["academic", "job"]),
  classLevel: z.enum(["6-8", "9-10", "11-12", "job"]),
  subject: z.string().min(1),
  type: z.enum(["full", "revision", "mcq", "chapter"]),
  price: z.number().min(0).default(0),
  regularPrice: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  enrollStartDate: z.string().optional(),
  enrollEndDate: z.string().optional(),
  courseDurationDays: z.number().min(1).default(180),
  thumbnail: z.string().optional(),
  outline: z.string().min(1, "আউটলাইন আবশ্যক"),
  isLive: z.boolean().default(false),
  liveMeetingLink: z.string().optional(),
  trailerVideoUrl: z.string().optional(),
  whatYouWillLearn: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  classSchedule: z
    .array(
      z.object({
        day: z.string().min(1),
        time: z.string().min(1),
        subject: z.string().optional(),
      })
    )
    .optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      })
    )
    .optional(),
  testimonials: z
    .array(
      z.object({
        name: z.string().min(1),
        institution: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        comment: z.string().min(1),
      })
    )
    .optional(),
});

export const createLectureSchema = z.object({
  title: z.string().min(1, "শিরোনাম আবশ্যক"),
  description: z.string().optional(),
  chapter: z.string().optional(),
  videoUrl: z.string().optional(),
  noteUrl: z.string().optional(),
  isFree: z.boolean().optional(),
});

export const createLiveClassSchema = z.object({
  title: z.string().min(1, "শিরোনাম আবশ্যক"),
  dateTime: z.string().min(1, "তারিখ ও সময় আবশ্যক"),
  meetLink: z.string().min(1, "মিট লিংক আবশ্যক"),
});

export const questionSchema = z.object({
  question: z.string().min(1, "প্রশ্ন লিখুন"),
});
