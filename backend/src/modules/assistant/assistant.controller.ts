import { Request, Response } from "express";
import * as assistantService from "./assistant.service";
import { chatSchema } from "./assistant.validation";

export async function chat(req: Request, res: Response) {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }

    const result = await assistantService.chatWithAssistant(
      parsed.data.message,
      parsed.data.history
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Assistant chat error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
