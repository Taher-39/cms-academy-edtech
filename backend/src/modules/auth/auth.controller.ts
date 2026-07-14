import { Request, Response } from "express";
import * as authService from "./auth.service";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  googleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./auth.validation";

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await authService.registerUser(
      parsed.data.name,
      parsed.data.email,
      parsed.data.password
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Register error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function verifyOtpHandler(req: Request, res: Response) {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "ইমেইল এবং OTP প্রদান করুন" });
    }
    const result = await authService.verifyUserOtp(parsed.data.email, parsed.data.otp);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await authService.loginUser(parsed.data.email, parsed.data.password);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Login error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function googleAuthHandler(req: Request, res: Response) {
  try {
    const parsed = googleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "ID token প্রদান করুন" });
    }
    const result = await authService.googleAuth(parsed.data.idToken);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Google auth error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "বৈধ ইমেইল প্রদান করুন" });
    }
    const result = await authService.forgotPassword(parsed.data.email);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Forgot password error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "সঠিক তথ্য প্রদান করুন" });
    }
    const result = await authService.resetPassword(
      parsed.data.email,
      parsed.data.otp,
      parsed.data.newPassword
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Reset password error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function changePasswordHandler(req: Request, res: Response) {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await authService.changePassword(
      req.user!.userId,
      parsed.data.oldPassword,
      parsed.data.newPassword
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Change password error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function updateProfileHandler(req: Request, res: Response) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await authService.updateProfile(req.user!.userId, parsed.data);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update profile error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function uploadAvatarHandler(req: Request, res: Response) {
  try {
    const file = (req as Request & { file?: { buffer: Buffer } }).file;
    if (!file) {
      return res.status(400).json({ message: "ছবি ফাইল প্রদান করুন" });
    }
    const result = await authService.uploadAvatar(req.user!.userId, file.buffer);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Upload avatar error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
