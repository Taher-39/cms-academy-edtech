import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "নাম আবশ্যক"),
  email: z.string().email("বৈধ ইমেইল দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

export const loginSchema = z.object({
  email: z.string().email("বৈধ ইমেইল দিন"),
  password: z.string().min(1, "পাসওয়ার্ড দিন"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const googleSchema = z.object({
  idToken: z.string().min(1, "ID token আবশ্যক"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("বৈধ ইমেইল দিন"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "নাম আবশ্যক").optional(),
  phone: z.string().trim().optional(),
});
