import crypto from "crypto";

type OtpRecord = {
  otp: string;
  expiresAt: number;
};

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const otpStore = new Map<string, OtpRecord>();

export function generateOtp() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

export function setOtp(email: string, otp: string) {
  otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + TTL_MS });
}

export function verifyOtp(email: string, otp: string) {
  const key = email.toLowerCase();
  const record = otpStore.get(key);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  const ok = record.otp === otp;
  if (ok) otpStore.delete(key);
  return ok;
}
