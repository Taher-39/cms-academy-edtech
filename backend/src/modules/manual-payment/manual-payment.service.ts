import { connectToDB } from "../../shared/lib/db";
import { ManualPaymentModel } from "../../shared/models/ManualPayment";
import { CourseModel } from "../../shared/models/Course";
import { EnrollmentModel } from "../../shared/models/Enrollment";
import { UserModel } from "../../shared/models/User";

interface SubmitManualPaymentInput {
  userId: string;
  courseId: string;
  phoneNumber: string;
  paymentMethod: string;
  screenshot?: string;
}

export async function submitManualPayment(input: SubmitManualPaymentInput) {
  await connectToDB();
  const { userId, courseId, phoneNumber, paymentMethod, screenshot } = input;

  // Check course exists and is approved
  const course = await CourseModel.findById(courseId).lean();
  if (!course) throw new Error("কোর্স পাওয়া যায়নি");
  if ((course as any).status !== "approved") throw new Error("এই কোর্সে বর্তমানে এনরোল করা যাচ্ছে না");

  // Check enrollment window
  const now = new Date();
  if ((course as any).enrollStartDate && now < new Date((course as any).enrollStartDate)) {
    throw new Error("এনরোলমেন্ট এখনো শুরু হয়নি");
  }
  if ((course as any).enrollEndDate && now > new Date((course as any).enrollEndDate)) {
    throw new Error("এনরোলমেন্টের সময় শেষ হয়ে গেছে");
  }

  // Check already enrolled
  const existing = await EnrollmentModel.findOne({
    student: userId,
    course: courseId,
    expiryAt: { $gt: now },
    paymentStatus: { $ne: "refunded" },
  });
  if (existing) throw new Error("আপনি ইতিমধ্যে এই কোর্সে এনরোল্ড আছেন");

  // Check pending manual payment
  const pending = await ManualPaymentModel.findOne({
    student: userId,
    course: courseId,
    status: "pending",
  });
  if (pending) throw new Error("আপনার ম্যানুয়াল পেমেন্ট ইতিমধ্যে জমা আছে, অপেক্ষা করুন");

  // Calculate amount (with loyalty discount)
  const previousEnrollments = await EnrollmentModel.countDocuments({ student: userId });
  const loyaltyDiscount = previousEnrollments > 0 ? 200 : 0;
  const amount = Math.max(0, (course as any).price - loyaltyDiscount);

  const payment = await ManualPaymentModel.create({
    student: userId,
    course: courseId,
    phoneNumber,
    paymentMethod,
    amount,
    screenshot: screenshot || undefined,
  });

  return { _id: payment._id, amount, message: "পেমেন্ট সাবমিট হয়েছে, অ্যাডমিন ভেরিফাই করবে" };
}

export async function listManualPayments(query: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDB();
  const { status, page = 1, limit = 20 } = query;

  const filter: any = {};
  if (status) filter.status = status;

  const total = await ManualPaymentModel.countDocuments(filter);
  const payments = await ManualPaymentModel.find(filter)
    .populate("student", "name email phone")
    .populate("course", "title price")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function countPendingManualPayments() {
  await connectToDB();
  return ManualPaymentModel.countDocuments({ status: "pending" });
}

export async function reviewManualPayment(
  paymentId: string,
  reviewerId: string,
  review: { status: "approved" | "rejected"; adminNotes?: string }
) {
  await connectToDB();

  const payment = await ManualPaymentModel.findById(paymentId);
  if (!payment) throw new Error("পেমেন্ট রেকর্ড পাওয়া যায়নি");
  if (payment.status !== "pending") throw new Error("এই পেমেন্ট ইতিমধ্যে রিভিউ করা হয়েছে");

  if (review.status === "approved") {
    // Get course for duration
    const course = await CourseModel.findById(payment.course).select("courseDurationDays").lean();
    const durationDays = (course as any)?.courseDurationDays ?? 180;

    const expiryAt = new Date();
    expiryAt.setDate(expiryAt.getDate() + durationDays);

    // Create enrollment
    const enrollment = await EnrollmentModel.create({
      student: payment.student,
      course: payment.course,
      paidAmount: payment.amount,
      discountApplied: 0,
      transactionId: `MANUAL-${payment._id}`,
      paymentStatus: "paid",
      enrolledAt: new Date(),
      expiryAt,
    });

    // Update course enrolled count
    await CourseModel.findByIdAndUpdate(payment.course, {
      $addToSet: { enrolledStudents: payment.student },
    });

    // Update user enrolled courses
    await UserModel.findByIdAndUpdate(payment.student, {
      $addToSet: { enrolledCourses: payment.course },
    });

    payment.enrollmentId = enrollment._id;
  }

  payment.status = review.status;
  payment.adminNotes = review.adminNotes;
  payment.reviewedBy = reviewerId as any;
  payment.reviewedAt = new Date();
  await payment.save();

  return {
    _id: payment._id,
    status: payment.status,
    enrollmentId: payment.enrollmentId,
    message: review.status === "approved" ? "পেমেন্ট এপ্রুভ করা হয়েছে, শিক্ষার্থী এনরোল্ড" : "পেমেন্ট রিজেক্ট করা হয়েছে",
  };
}
