import { z } from "zod";

export const answerSchema = z.object({
  reply: z.string().min(1, "উত্তর লিখুন"),
});
