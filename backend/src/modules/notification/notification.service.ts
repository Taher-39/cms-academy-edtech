import { connectToDB } from "../../shared/lib/db";
import { NotificationModel, NotificationType } from "../../shared/models/Notification";
import { UserModel } from "../../shared/models/User";

interface NotifyInput {
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Fire-and-forget notification write. Notifications are a side effect of other
 * flows (payments, answers, bookings), so a failure here must never fail the
 * action that triggered it.
 */
export async function notify(input: NotifyInput) {
  try {
    await connectToDB();
    await NotificationModel.create({
      user: input.user,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    });
  } catch (error) {
    console.error("Notification create failed:", error);
  }
}

export async function notifyMany(userIds: string[], input: Omit<NotifyInput, "user">) {
  const unique = [...new Set(userIds.map((id) => String(id)))];
  if (unique.length === 0) return;
  try {
    await connectToDB();
    await NotificationModel.insertMany(
      unique.map((user) => ({
        user,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      }))
    );
  } catch (error) {
    console.error("Bulk notification create failed:", error);
  }
}

/** Notify every admin/superAdmin — used for things needing staff action. */
export async function notifyAdmins(input: Omit<NotifyInput, "user">) {
  try {
    await connectToDB();
    const admins = await UserModel.find({ role: { $in: ["admin", "superAdmin"] } })
      .select("_id")
      .lean();
    await notifyMany(
      admins.map((a: { _id: unknown }) => String(a._id)),
      input
    );
  } catch (error) {
    console.error("Admin notification failed:", error);
  }
}

// ============ Reads ============

export async function listNotifications(userId: string, page: number, limit: number, unreadOnly: boolean) {
  await connectToDB();

  const filter: Record<string, unknown> = { user: userId };
  if (unreadOnly) filter.isRead = false;

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NotificationModel.countDocuments(filter),
    NotificationModel.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getUnreadCount(userId: string) {
  await connectToDB();
  const unreadCount = await NotificationModel.countDocuments({ user: userId, isRead: false });
  return { unreadCount };
}

export async function markRead(userId: string, notificationId: string) {
  await connectToDB();

  const updated = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!updated) {
    throw { status: 404, message: "নোটিফিকেশন পাওয়া যায়নি" };
  }

  return { message: "পঠিত হিসেবে চিহ্নিত হয়েছে", notification: updated };
}

export async function markAllRead(userId: string) {
  await connectToDB();
  await NotificationModel.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { message: "সব নোটিফিকেশন পঠিত হিসেবে চিহ্নিত হয়েছে" };
}

export async function deleteNotification(userId: string, notificationId: string) {
  await connectToDB();

  const deleted = await NotificationModel.findOneAndDelete({
    _id: notificationId,
    user: userId,
  });

  if (!deleted) {
    throw { status: 404, message: "নোটিফিকেশন পাওয়া যায়নি" };
  }

  return { message: "নোটিফিকেশন মুছে ফেলা হয়েছে" };
}

export async function clearAll(userId: string) {
  await connectToDB();
  await NotificationModel.deleteMany({ user: userId });
  return { message: "সব নোটিফিকেশন মুছে ফেলা হয়েছে" };
}
