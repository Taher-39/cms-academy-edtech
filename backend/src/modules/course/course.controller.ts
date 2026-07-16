import { Request, Response } from "express";
import * as courseService from "./course.service";
import {
  createCourseSchema,
  createLectureSchema,
  createLiveClassSchema,
  questionSchema,
} from "./course.validation";

// ============ Courses ============

export async function listCourses(req: Request, res: Response) {
  try {
    const result = await courseService.listCourses(
      {
        category: req.query.category as string,
        classLevel: req.query.classLevel as string,
        type: req.query.type as string,
        free: req.query.free as string,
        search: req.query.search as string,
        status: req.query.status as string,
        featured: req.query.featured as string,
        mine: req.query.mine as string,
        page: parseInt((req.query.page as string) || "1"),
        limit: parseInt((req.query.limit as string) || "12"),
      },
      req.user ? { userId: req.user.userId, role: req.user.role } : undefined
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("GET courses error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function uploadThumbnail(req: Request, res: Response) {
  try {
    const file = (req as Request & { file?: { buffer: Buffer } }).file;
    if (!file) {
      return res.status(400).json({ message: "ছবি ফাইল প্রদান করুন" });
    }
    const result = await courseService.uploadCourseThumbnail(file.buffer);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Upload thumbnail error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const result = await courseService.getCourseById(req.params.courseId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("GET course error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function createCourse(req: Request, res: Response) {
  try {
    const parsed = createCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await courseService.createCourse(parsed.data);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("POST course error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function updateCourse(req: Request, res: Response) {
  try {
    const result = await courseService.updateCourse(req.params.courseId, req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("PUT course error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function deleteCourse(req: Request, res: Response) {
  try {
    const result = await courseService.deleteCourse(req.params.courseId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("DELETE course error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

// ============ Lectures ============

export async function listLectures(req: Request, res: Response) {
  try {
    const result = await courseService.listLectures(
      req.params.courseId,
      req.user?.userId,
      req.user?.role
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("GET lectures error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function createLecture(req: Request, res: Response) {
  try {
    const parsed = createLectureSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await courseService.createLecture(
      req.params.courseId,
      parsed.data,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("POST lecture error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

// ============ Live Classes ============

export async function listLiveClasses(req: Request, res: Response) {
  try {
    const result = await courseService.listLiveClasses(req.params.courseId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("GET live classes error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function createLiveClass(req: Request, res: Response) {
  try {
    const parsed = createLiveClassSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await courseService.createLiveClass(
      req.params.courseId,
      parsed.data,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("POST live class error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

// ============ Lecture Update & Delete ============

export async function updateLecture(req: Request, res: Response) {
  try {
    const result = await courseService.updateLecture(
      req.params.courseId,
      req.params.lectureId,
      req.body,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("PUT lecture error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function deleteLecture(req: Request, res: Response) {
  try {
    const result = await courseService.deleteLecture(
      req.params.courseId,
      req.params.lectureId,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("DELETE lecture error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

// ============ Q&A ============

export async function listQnA(req: Request, res: Response) {
  try {
    const result = await courseService.listQnA(
      req.params.courseId,
      req.user!.userId,
      req.user!.role || ""
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("GET QnA error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message, qna: [] });
    return res.status(500).json({ message: "সার্ভার ত্রুটি", qna: [] });
  }
}

export async function askQuestion(req: Request, res: Response) {
  try {
    const parsed = questionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await courseService.askQuestion(
      req.params.courseId,
      req.user!.userId,
      parsed.data.question,
      parsed.data.images
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("POST QnA error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
