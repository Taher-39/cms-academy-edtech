import { Request, Response } from "express";
import * as liveService from "./live.service";
import { recordLectureSchema, updateLiveClassSchema } from "./live.validation";

export async function attachRecording(req: Request, res: Response) {
  try {
    const parsed = recordLectureSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await liveService.attachRecording(
      req.params.id,
      parsed.data.recordedLecture
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Record lecture error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function updateLiveClass(req: Request, res: Response) {
  try {
    const parsed = updateLiveClassSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }

    const result = await liveService.updateLiveClass(
      req.params.liveId,
      {
        title: parsed.data.title,
        dateTime: new Date(parsed.data.dateTime),
        meetLink: parsed.data.meetLink,
      },
      req.user!.userId,
      req.user!.role || ""
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update live class error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function deleteLiveClass(req: Request, res: Response) {
  try {
    const result = await liveService.deleteLiveClass(
      req.params.liveId,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Delete live class error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

