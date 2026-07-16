import { z } from "zod";

export const initSessionSchema = z.object({
  teacherId: z.string().min(1, "শিক্ষক নির্বাচন আবশ্যক"),
  subject: z.string().min(1, "বিষয় লিখুন"),
  topics: z.string().min(1, "টপিক লিখুন"),
  requestedSchedule: z.string().min(1, "সময়সূচী দিন"),
  durationHours: z.number().min(1).max(4).default(1),
});

export const acceptSessionSchema = z.object({
  meetLink: z.string().min(1, "মিট লিংক আবশ্যক"),
});

export const declineSessionSchema = z.object({
  note: z.string().optional(),
});
