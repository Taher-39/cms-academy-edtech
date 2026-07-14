import { transporter } from "../config/nodemailer";

export async function sendOtpEmail(email: string, otp: string) {
  const from = process.env.NODEMAILER_USER;
  if (!from) throw new Error("NODEMAILER_USER is not defined");

  const subject = "আপনার OTP কোড";
  const text = `আপনার OTP কোড হলো: ${otp}. অনুগ্রহ করে এই কোডটি নির্ধারিত সময়ের মধ্যে ব্যবহার করুন।`;

  await transporter.sendMail({ from, to: email, subject, text });
}
