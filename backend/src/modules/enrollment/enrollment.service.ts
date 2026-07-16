import { connectToDB } from "../../shared/lib/db";
import { EnrollmentModel } from "../../shared/models/Enrollment";
import { CourseModel } from "../../shared/models/Course";
import { UserModel } from "../../shared/models/User";
import { LectureModel } from "../../shared/models/Lecture";
import { sslcommerz } from "../../shared/config/sslcommerz";

export async function enrollStudent(userId: string, courseId: string) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  if (course.price > 0) {
    throw { status: 400, message: "এই কোর্সটি পেইড, পেমেন্টের মাধ্যমে এনরোল করুন" };
  }

  const now = new Date();
  const courseData = course as unknown as { enrollStartDate?: Date; enrollEndDate?: Date };

  if (courseData.enrollStartDate && now < new Date(courseData.enrollStartDate)) {
    throw { status: 400, message: "এই কোর্সে এনরোলমেন্ট এখনো শুরু হয়নি" };
  }
  if (courseData.enrollEndDate && now > new Date(courseData.enrollEndDate)) {
    throw { status: 400, message: "এই কোর্সে এনরোলমেন্ট শেষ হয়েছে" };
  }

  const existing = await EnrollmentModel.findOne({
    student: userId,
    course: courseId,
    expiryAt: { $gt: new Date() },
  });

  if (existing) {
    throw { status: 409, message: "আপনি ইতিমধ্যে এই কোর্সে এনরোল্ড" };
  }

  const enrollment = await EnrollmentModel.create({
    student: userId,
    course: courseId,
    // Course is confirmed free above, so payment fields are always zero here —
    // never trust client-supplied paidAmount/discountApplied for money fields.
    paidAmount: 0,
    discountApplied: 0,
  });

  await CourseModel.findByIdAndUpdate(courseId, {
    $addToSet: { enrolledStudents: userId },
  });

  await UserModel.findByIdAndUpdate(userId, {
    $addToSet: { enrolledCourses: courseId },
  });

  return { message: "এনরোলমেন্ট সফল", enrollment };
}

export async function getUserEnrollments(userId: string) {
  await connectToDB();

  const enrollments = await EnrollmentModel.find({ student: userId })
    .populate("course", "title thumbnail price category classLevel")
    .sort({ enrolledAt: -1 })
    .lean();

  const withProgress = await Promise.all(
    enrollments.map(async (enrollment: any) => {
      const total = enrollment.course
        ? await LectureModel.countDocuments({ course: enrollment.course._id })
        : 0;
      const watched = (enrollment.watchedLectures || []).length;
      const percent = total > 0 ? Math.round((Math.min(watched, total) / total) * 100) : 0;
      return { ...enrollment, progress: { watched, total, percent } };
    })
  );

  return { enrollments: withProgress };
}

export async function checkAccess(userId: string, courseId: string, role?: string) {
  await connectToDB();

  // superAdmin has default access to every course — no enrollment record needed.
  if (role === "superAdmin") {
    return { hasAccess: true };
  }

  const enrollment = await EnrollmentModel.findOne({
    student: userId,
    course: courseId,
    expiryAt: { $gt: new Date() },
  });

  return { hasAccess: !!enrollment };
}

export async function markLectureWatched(userId: string, courseId: string, lectureId: string) {
  await connectToDB();

  const enrollment = await EnrollmentModel.findOne({
    student: userId,
    course: courseId,
    expiryAt: { $gt: new Date() },
  });

  if (!enrollment) {
    throw { status: 403, message: "এই কোর্সে আপনার সক্রিয় এনরোলমেন্ট নেই" };
  }

  const lecture = await LectureModel.findOne({ _id: lectureId, course: courseId });
  if (!lecture) {
    throw { status: 404, message: "লেকচার পাওয়া যায়নি" };
  }

  await EnrollmentModel.updateOne(
    { _id: enrollment._id },
    { $addToSet: { watchedLectures: lectureId } }
  );

  const total = await LectureModel.countDocuments({ course: courseId });
  const updated = await EnrollmentModel.findById(enrollment._id).lean();
  const watched = ((updated as any)?.watchedLectures || []).length;
  const percent = total > 0 ? Math.round((Math.min(watched, total) / total) * 100) : 0;

  return { message: "লেকচার সম্পন্ন হিসেবে চিহ্নিত হয়েছে", progress: { watched, total, percent } };
}

// ============ Admin ============

interface AllEnrollmentsParams {
  page: number;
  limit: number;
  paymentStatus?: string;
}

export async function getAllEnrollments(params: AllEnrollmentsParams) {
  await connectToDB();

  const filter: Record<string, unknown> = {};
  if (params.paymentStatus) filter.paymentStatus = params.paymentStatus;

  const skip = (params.page - 1) * params.limit;

  const [enrollments, total] = await Promise.all([
    EnrollmentModel.find(filter)
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean(),
    EnrollmentModel.countDocuments(filter),
  ]);

  return {
    enrollments,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
    },
  };
}

// ============ Free Access Grants (superAdmin -> admin) ============

export async function grantFreeAccess(targetUserId: string, courseId: string, grantedBy: string) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) {
    throw { status: 404, message: "ব্যবহারকারী পাওয়া যায়নি" };
  }
  if (targetUser.role !== "admin") {
    throw { status: 400, message: "শুধুমাত্র এডমিনদের ফ্রি অ্যাক্সেস দেওয়া যায়" };
  }

  const existing = await EnrollmentModel.findOne({
    student: targetUserId,
    course: courseId,
    expiryAt: { $gt: new Date() },
  });
  if (existing) {
    throw { status: 409, message: "ইতিমধ্যে এই কোর্সে অ্যাক্সেস আছে" };
  }

  const enrollment = await EnrollmentModel.create({
    student: targetUserId,
    course: courseId,
    paidAmount: 0,
    discountApplied: 0,
    grantedBy,
  });

  await CourseModel.findByIdAndUpdate(courseId, {
    $addToSet: { enrolledStudents: targetUserId },
  });
  await UserModel.findByIdAndUpdate(targetUserId, {
    $addToSet: { enrolledCourses: courseId },
  });

  return { message: "ফ্রি অ্যাক্সেস দেওয়া হয়েছে", enrollment };
}

export async function listGrantedAccess() {
  await connectToDB();

  const grants = await EnrollmentModel.find({ grantedBy: { $ne: null } })
    .populate("student", "name email role")
    .populate("course", "title")
    .populate("grantedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return { grants };
}

export async function revokeFreeAccess(enrollmentId: string) {
  await connectToDB();

  const enrollment = await EnrollmentModel.findById(enrollmentId);
  if (!enrollment) {
    throw { status: 404, message: "রেকর্ড পাওয়া যায়নি" };
  }
  if (!enrollment.grantedBy) {
    throw { status: 400, message: "এটি ম্যানুয়ালি দেওয়া অ্যাক্সেস নয়, প্রত্যাহার করা যাবে না" };
  }

  await EnrollmentModel.findByIdAndDelete(enrollmentId);
  await CourseModel.findByIdAndUpdate(enrollment.course, {
    $pull: { enrolledStudents: enrollment.student },
  });
  await UserModel.findByIdAndUpdate(enrollment.student, {
    $pull: { enrolledCourses: enrollment.course },
  });

  return { message: "অ্যাক্সেস প্রত্যাহার করা হয়েছে" };
}

export async function refundEnrollment(enrollmentId: string, remarks: string) {
  await connectToDB();

  const enrollment = await EnrollmentModel.findById(enrollmentId);
  if (!enrollment) {
    throw { status: 404, message: "এনরোলমেন্ট পাওয়া যায়নি" };
  }
  if (enrollment.paymentStatus === "refunded") {
    throw { status: 400, message: "এই পেমেন্ট ইতিমধ্যে রিফান্ড করা হয়েছে" };
  }

  let refundRefId: string | undefined;

  if (enrollment.bankTransactionId && enrollment.transactionId) {
    try {
      const refundResponse = await sslcommerz.initiateRefund({
        refund_amount: enrollment.paidAmount,
        refund_remarks: remarks,
        bank_tran_id: enrollment.bankTransactionId,
        refe_id: enrollment.transactionId,
      });
      refundRefId = refundResponse.refund_ref_id;
    } catch (error) {
      // SSLCommerz refund can be asynchronous / require merchant-panel follow-up.
      // TODO: retry via sslcommerz.refundQuery() if the gateway call fails here.
      console.error("SSLCommerz refund call failed, marking refunded locally:", error);
    }
  }

  enrollment.paymentStatus = "refunded";
  enrollment.refundedAt = new Date();
  enrollment.refundAmount = enrollment.paidAmount;
  enrollment.refundRemarks = remarks;
  if (refundRefId) enrollment.refundRefId = refundRefId;
  enrollment.expiryAt = new Date();
  await enrollment.save();

  return { message: "রিফান্ড সম্পন্ন হয়েছে", enrollment };
}
