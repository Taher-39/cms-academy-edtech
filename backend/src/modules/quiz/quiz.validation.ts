import { z } from "zod";

export const generateQuestionsSchema = z.object({
  chapter: z.string().min(1, "চ্যাপ্টার/টপিক নাম আবশ্যক"),
  count: z.number().min(1).max(30).optional(),
  instructions: z.string().max(500).optional(),
});

export const questionInputSchema = z.object({
  chapter: z.string().min(1, "চ্যাপ্টার/টপিক নাম আবশ্যক"),
  question: z.string().min(1, "প্রশ্ন লিখুন"),
  options: z.array(z.string().min(1)).min(2, "কমপক্ষে ২টি অপশন দিন").max(6),
  correctOptionIndex: z.number().min(0),
  explanation: z.string().optional(),
});

export const updateQuestionSchema = questionInputSchema.partial();

export const startAttemptSchema = z.object({
  chapter: z.string().min(1, "চ্যাপ্টার/টপিক নাম আবশ্যক"),
});

export const submitAttemptSchema = z.object({
  // Positional — answers[i] is the student's pick for attempt.questions[i].
  // null/undefined means left unanswered.
  answers: z.array(z.number().min(0).nullable()),
});
