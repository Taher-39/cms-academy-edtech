import { z } from "zod";

export const chatSchema = z.object({
  message: z.string().min(1, "বার্তা লিখুন").max(1000, "বার্তা অনেক বড়, ছোট করে লিখুন"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().max(2000),
      })
    )
    .max(20)
    .optional(),
});
