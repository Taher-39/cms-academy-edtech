import { Request, Response } from "express";
import * as categoryService from "./category.service";
import { createCategorySchema, updateCategorySchema } from "./category.validation";

export async function listCategories(_req: Request, res: Response) {
  try {
    const result = await categoryService.listCategories();
    return res.status(200).json(result);
  } catch (error) {
    console.error("List categories error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await categoryService.createCategory(parsed.data);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Create category error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues.map((e) => e.message).join(", "),
      });
    }
    const result = await categoryService.updateCategory(req.params.categoryId, parsed.data);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update category error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const result = await categoryService.deleteCategory(req.params.categoryId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Delete category error:", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
}
