import { Request, Response } from "express";
import * as analyticsService from "./analytics.service";

export async function getSummary(_req: Request, res: Response) {
  try {
    const result = await analyticsService.getSummary();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Analytics summary error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function getTopCourses(req: Request, res: Response) {
  try {
    const limit = parseInt((req.query.limit as string) || "5");
    const result = await analyticsService.getTopCourses(limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Top courses error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function getRevenueTrend(req: Request, res: Response) {
  try {
    const months = parseInt((req.query.months as string) || "6");
    const result = await analyticsService.getRevenueTrend(months);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Revenue trend error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
