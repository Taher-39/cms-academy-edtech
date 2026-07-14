import { z } from "zod";

export const recordLectureSchema = z.object({
  recordedLecture: z.string().min(1, "লেকচার আইডি আবশ্যক"),
});

export const updateLiveClassSchema = z.object({
  title: z.string().min(1, "শিরোনাম আবশ্যক"),
  dateTime: z
    .string()
    .min(1, "তারিখ ও সময় আবশ্যক")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "ভুল তারিখ/সময়"),
  meetLink: z.string().min(1, "Meet লিংক আবশ্যক"),
});

