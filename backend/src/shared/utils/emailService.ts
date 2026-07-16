import { transporter } from "../config/nodemailer";
import { renderEmailTemplate } from "./emailTemplate";

export async function sendOtpEmail(email: string, otp: string) {
  const from = process.env.NODEMAILER_USER;
  if (!from) throw new Error("NODEMAILER_USER is not defined");

  const subject = "আপনার OTP কোড";
  const text = `আপনার OTP কোড হলো: ${otp}. অনুগ্রহ করে এই কোডটি নির্ধারিত সময়ের মধ্যে ব্যবহার করুন।`;
  const html = renderEmailTemplate(
    "আপনার ভেরিফিকেশন কোড",
    `
      <p>আপনার অ্যাকাউন্ট ভেরিফাই করতে নিচের কোডটি ব্যবহার করুন:</p>
      <p style="text-align:center; margin:24px 0;">
        <span style="display:inline-block; padding:12px 28px; background-color:#f4f4f5; border-radius:8px; font-size:28px; font-weight:700; letter-spacing:6px; color:#0F5D5A;">${otp}</span>
      </p>
      <p>কোডটি অল্প সময়ের মধ্যে মেয়াদোত্তীর্ণ হয়ে যাবে। নিরাপত্তার জন্য এই কোডটি কারো সাথে শেয়ার করবেন না।</p>
    `
  );

  await transporter.sendMail({ from, to: email, subject, text, html });
}

const roleLabels: Record<string, string> = {
  teacher: "শিক্ষক",
  admin: "অ্যাডমিন",
  superAdmin: "সুপার অ্যাডমিন",
  student: "শিক্ষার্থী",
};

export async function sendAccountCreatedEmail(
  email: string,
  name: string,
  password: string,
  role: string
) {
  const from = process.env.NODEMAILER_USER;
  if (!from) throw new Error("NODEMAILER_USER is not defined");

  const roleLabel = roleLabels[role] || role;
  const subject = `আপনার ${roleLabel} অ্যাকাউন্ট তৈরি করা হয়েছে`;
  const text = `প্রিয় ${name},\n\nCMS Academy-তে আপনার জন্য একটি ${roleLabel} অ্যাকাউন্ট তৈরি করা হয়েছে।\n\nইমেইল: ${email}\nপাসওয়ার্ড: ${password}\n\nঅনুগ্রহ করে লগইন করে দ্রুত পাসওয়ার্ড পরিবর্তন করে নিন।`;
  const html = renderEmailTemplate(
    `আপনার ${roleLabel} অ্যাকাউন্ট তৈরি করা হয়েছে`,
    `
      <p>প্রিয় ${name},</p>
      <p>CMS Academy-তে আপনার জন্য একটি <strong>${roleLabel}</strong> অ্যাকাউন্ট তৈরি করা হয়েছে। নিচে আপনার লগইন তথ্য দেওয়া হলো:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0; background-color:#f4f4f5; border-radius:8px;">
        <tr>
          <td style="padding:12px 16px 0;">
            <p style="margin:0; font-size:12px; color:#71717a;">ইমেইল</p>
            <p style="margin:2px 0 0; font-size:15px; font-weight:600; color:#0F5D5A;">${email}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 16px 14px;">
            <p style="margin:0; font-size:12px; color:#71717a;">পাসওয়ার্ড</p>
            <p style="margin:2px 0 0; font-size:15px; font-weight:600; color:#0F5D5A;">${password}</p>
          </td>
        </tr>
      </table>
      <p>নিরাপত্তার জন্য অনুগ্রহ করে লগইন করে দ্রুত আপনার পাসওয়ার্ড পরিবর্তন করে নিন।</p>
    `
  );

  await transporter.sendMail({ from, to: email, subject, text, html });
}
