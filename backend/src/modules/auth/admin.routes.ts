import { Router, Request, Response } from "express";
import { authMiddleware, requireRole } from "../../shared/middleware/auth.middleware";
import { UserModel, userRoles } from "../../shared/models/User";
import { connectToDB } from "../../shared/lib/db";

const privilegedRoles = ["admin", "superAdmin"];

const router = Router();

// GET /api/auth/users — List all users (admin only)
router.get("/users", authMiddleware, requireRole("admin", "superAdmin"), async (_req: Request, res: Response) => {
  try {
    await connectToDB();
    const users = await UserModel.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

// PUT /api/auth/users/:id — Update user role (admin only)
router.put("/users/:id", authMiddleware, requireRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    await connectToDB();
    const { role } = req.body;
    if (!userRoles.includes(role)) {
      return res.status(400).json({ message: "অবৈধ রোল" });
    }

    const requesterRole = req.user!.role || "";
    if (privilegedRoles.includes(role) && requesterRole !== "superAdmin") {
      return res.status(403).json({ message: "শুধুমাত্র সুপার অ্যাডমিন এই রোল দিতে পারবেন" });
    }

    const targetUser = await UserModel.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "ব্যবহারকারী পাওয়া যায়নি" });
    }

    if (
      requesterRole !== "superAdmin" &&
      privilegedRoles.includes(targetUser.role)
    ) {
      return res.status(403).json({ message: "এই ব্যবহারকারীর রোল পরিবর্তনের অনুমতি নেই" });
    }

    targetUser.role = role;
    await targetUser.save();
    const user = await UserModel.findById(targetUser._id).select("-password");
    return res.status(200).json({ message: "রোল আপডেট করা হয়েছে", user });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

// DELETE /api/auth/users/:id — Delete user (admin only)
router.delete("/users/:id", authMiddleware, requireRole("admin", "superAdmin"), async (req: Request, res: Response) => {
  try {
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({ message: "নিজেকে মুছে ফেলা যাবে না" });
    }

    await connectToDB();
    const targetUser = await UserModel.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "ব্যবহারকারী পাওয়া যায়নি" });
    }

    const requesterRole = req.user!.role || "";
    if (requesterRole !== "superAdmin" && privilegedRoles.includes(targetUser.role)) {
      return res.status(403).json({ message: "এই ব্যবহারকারীকে মুছে ফেলার অনুমতি নেই" });
    }

    await UserModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "ব্যবহারকারী মুছে ফেলা হয়েছে" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

export default router;
