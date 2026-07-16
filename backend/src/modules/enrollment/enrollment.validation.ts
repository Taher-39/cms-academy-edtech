import { z } from "zod";

export const enrollSchema = z.object({
  courseId: z.string().min(1),
});

export const grantAccessSchema = z.object({
  userId: z.string().min(1, "ব্যবহারকারী নির্বাচন আবশ্যক"),
  courseId: z.string().min(1, "কোর্স নির্বাচন আবশ্যক"),
});
