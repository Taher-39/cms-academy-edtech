import { Request, Response } from "express";
import * as qnaService from "./qna.service";
import { answerSchema } from "./qna.validation";

export async function answerQuestion(req: Request, res: Response) {
  try {
    const parsed = answerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await qnaService.answerQuestion(
      req.params.qnaId,
      req.user!.userId,
      parsed.data.reply,
      parsed.data.images
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Answer error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
