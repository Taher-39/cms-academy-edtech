import { Request, Response } from "express";
import * as settingsService from "./settings.service";
import { updateSettingsSchema } from "./settings.validation";

export async function getSettings(_req: Request, res: Response) {
  try {
    const result = await settingsService.getSettings();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get settings error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await settingsService.updateSettings(parsed.data, req.user!.userId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update settings error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
