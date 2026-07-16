import { connectToDB } from "../../shared/lib/db";
import { CourseModel } from "../../shared/models/Course";
import { UserModel } from "../../shared/models/User";
import { OneToOneSessionModel } from "../../shared/models/OneToOneSession";
import * as paymentService from "../payment/payment.service";

export async function listTeachers() {
  await connectToDB();

  const grouped = await CourseModel.aggregate([
    { $match: { status: "approved" } },
    {
      $group: {
        _id: "$teacher",
        subjects: { $addToSet: "$subject" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "teacher",
      },
    },
    { $unwind: "$teacher" },
    {
      $project: {
        _id: "$teacher._id",
        name: "$teacher.name",
        avatar: "$teacher.avatar",
        subjects: 1,
      },
    },
    { $sort: { name: 1 } },
  ]);

  return { teachers: grouped, pricePerHour: paymentService.SESSION_PRICE_PER_HOUR };
}

export async function initBooking(
  userId: string,
  email: string,
  data: {
    teacherId: string;
    subject: string;
    chapter?: string;
    series?: string;
    topics: string;
    requestedSchedule: string;
    durationHours: number;
  }
) {
  return paymentService.initSessionPayment(userId, email, data);
}

export async function manualInitBooking(
  userId: string,
  data: {
    teacherId: string;
    subject: string;
    chapter?: string;
    series?: string;
    topics: string;
    requestedSchedule: string;
    durationHours: number;
    paymentMethod: string;
    phoneNumber: string;
    screenshot?: string;
  }
) {
  await connectToDB();

  const teacher = await UserModel.findById(data.teacherId).select("role name").lean();
  if (!teacher || (teacher as any).role !== "teacher") {
    throw { status: 400, message: "নির্বাচিত শিক্ষক পাওয়া যায়নি" };
  }

  const schedule = new Date(data.requestedSchedule);
  if (isNaN(schedule.getTime()) || schedule.getTime() <= Date.now()) {
    throw { status: 400, message: "সময়সূচী সঠিক নয় — ভবিষ্যতের একটি সময় দিন" };
  }

  const amount = paymentService.SESSION_PRICE_PER_HOUR * data.durationHours;

  const session = await OneToOneSessionModel.create({
    student: userId,
    teacher: data.teacherId,
    subject: data.subject,
    chapter: data.chapter || "",
    series: data.series || "",
    topics: data.topics,
    requestedSchedule: schedule,
    durationHours: data.durationHours,
    pricePerHour: paymentService.SESSION_PRICE_PER_HOUR,
    amount,
    status: "awaiting_teacher",
    transactionId: `MANUAL-SESSION-${Date.now()}`,
    paymentMethod: data.paymentMethod,
    phoneNumber: data.phoneNumber,
    screenshot: data.screenshot,
    paymentStatus: "pending",
  });

  return {
    _id: session._id,
    amount,
    message: "সেশন বুকিং সাবমিট হয়েছে! অ্যাডমিন পেমেন্ট ভেরিফাই করে সেশনটি অ্যাক্টিভেট করবে।",
  };
}

export async function listMine(userId: string, role: string) {
  await connectToDB();

  const isAdmin = role === "admin" || role === "superAdmin";
  const filter = isAdmin ? {} : role === "teacher" ? { teacher: userId } : { student: userId };

  const sessions = await OneToOneSessionModel.find(filter)
    .populate("student", "name email avatar")
    .populate("teacher", "name email avatar")
    .sort({ createdAt: -1 })
    .lean();

  return { sessions };
}

export async function acceptSession(sessionId: string, teacherId: string, meetLink: string) {
  await connectToDB();

  const session = await OneToOneSessionModel.findById(sessionId);
  if (!session) {
    throw { status: 404, message: "সেশন পাওয়া যায়নি" };
  }
  if (session.teacher.toString() !== teacherId) {
    throw { status: 403, message: "অনুমতি নেই" };
  }
  if (session.status !== "awaiting_teacher") {
    throw { status: 400, message: "এই সেশনে ইতিমধ্যে সাড়া দেওয়া হয়েছে" };
  }

  session.status = "accepted";
  session.meetLink = meetLink;
  session.respondedAt = new Date();
  await session.save();

  return { message: "সেশন গ্রহণ করা হয়েছে", session };
}

export async function declineSession(sessionId: string, teacherId: string, note?: string) {
  await connectToDB();

  const session = await OneToOneSessionModel.findById(sessionId);
  if (!session) {
    throw { status: 404, message: "সেশন পাওয়া যায়নি" };
  }
  if (session.teacher.toString() !== teacherId) {
    throw { status: 403, message: "অনুমতি নেই" };
  }
  if (session.status !== "awaiting_teacher") {
    throw { status: 400, message: "এই সেশনে ইতিমধ্যে সাড়া দেওয়া হয়েছে" };
  }

  session.status = "declined";
  session.teacherNote = note || "";
  session.respondedAt = new Date();
  await session.save();

  return { message: "সেশন প্রত্যাখ্যান করা হয়েছে — এডমিন রিফান্ড প্রসেস করবেন", session };
}

export async function cancelSession(sessionId: string, userId: string, role: string) {
  await connectToDB();

  const session = await OneToOneSessionModel.findById(sessionId);
  if (!session) {
    throw { status: 404, message: "সেশন পাওয়া যায়নি" };
  }
  const isAdmin = role === "admin" || role === "superAdmin";
  if (!isAdmin && session.student.toString() !== userId) {
    throw { status: 403, message: "অনুমতি নেই" };
  }
  if (session.status !== "awaiting_teacher") {
    throw { status: 400, message: "শুধুমাত্র শিক্ষকের সাড়া দেওয়ার আগে সেশন বাতিল করা যাবে" };
  }

  session.status = "cancelled";
  await session.save();

  return { message: "সেশন বাতিল করা হয়েছে — এডমিন রিফান্ড প্রসেস করবেন" };
}

export async function markCompleted(sessionId: string, userId: string, role: string) {
  await connectToDB();

  const session = await OneToOneSessionModel.findById(sessionId);
  if (!session) {
    throw { status: 404, message: "সেশন পাওয়া যায়নি" };
  }
  const isAdmin = role === "admin" || role === "superAdmin";
  if (!isAdmin && session.teacher.toString() !== userId) {
    throw { status: 403, message: "অনুমতি নেই" };
  }
  if (session.status !== "accepted") {
    throw { status: 400, message: "শুধুমাত্র গৃহীত সেশন সম্পন্ন হিসেবে চিহ্নিত করা যাবে" };
  }

  session.status = "completed";
  await session.save();

  return { message: "সেশন সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে", session };
}
