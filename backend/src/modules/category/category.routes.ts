import { Router } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import * as categoryController from "./category.controller";

const router = Router();

router.get("/", categoryController.listCategories);
router.post("/", authMiddleware, requireRole("admin", "superAdmin"), categoryController.createCategory);
router.put(
  "/:categoryId",
  authMiddleware,
  requireRole("admin", "superAdmin"),
  categoryController.updateCategory
);
router.delete(
  "/:categoryId",
  authMiddleware,
  requireRole("admin", "superAdmin"),
  categoryController.deleteCategory
);

export default router;
