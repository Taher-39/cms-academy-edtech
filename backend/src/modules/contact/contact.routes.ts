import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";
import { transporter as sharedTransporter } from "../../shared/config/nodemailer";
import { renderEmailTemplate } from "../../shared/utils/emailTemplate";

const router = Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "নাম, ইমেইল ও বার্তা আবশ্যক" });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `CMS Academy - Contact Form: ${name}`,
      html: `
        <h2>নতুন বার্তা (Contact Form)</h2>
        <p><strong>নাম:</strong> ${name}</p>
        <p><strong>ইমেইল:</strong> ${email}</p>
        <p><strong>বার্তা:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "আপনার বার্তা পাঠানো হয়েছে!" });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ message: "বার্তা পাঠানো ব্যর্থ" });
  }
});

router.post("/teacher-application", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, qualification, message } = req.body;

    if (!name || !email || !phone || !subject || !qualification) {
      return res
        .status(400)
        .json({ message: "নাম, ইমেইল, ফোন, বিষয় ও যোগ্যতা আবশ্যক" });
    }

    const from = process.env.NODEMAILER_USER;
    if (!from) throw new Error("NODEMAILER_USER is not defined");

    const html = renderEmailTemplate(
      "নতুন শিক্ষক আবেদন",
      `
        <p><strong>নাম:</strong> ${name}</p>
        <p><strong>ইমেইল:</strong> ${email}</p>
        <p><strong>ফোন:</strong> ${phone}</p>
        <p><strong>যে বিষয়ে পড়াতে চান:</strong> ${subject}</p>
        <p><strong>যোগ্যতা/অভিজ্ঞতা:</strong> ${qualification}</p>
        ${message ? `<p><strong>বার্তা:</strong><br/>${message}</p>` : ""}
      `
    );

    await sharedTransporter.sendMail({
      from,
      to: from,
      replyTo: email,
      subject: `CMS Academy - শিক্ষক আবেদন: ${name}`,
      html,
    });

    return res
      .status(200)
      .json({ message: "আপনার আবেদন জমা দেওয়া হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।" });
  } catch (error) {
    console.error("Teacher application error:", error);
    return res.status(500).json({ message: "আবেদন জমা দেওয়া ব্যর্থ" });
  }
});

export default router;
