import mongoose from "mongoose";
import { connectToDB } from "../../shared/lib/db";
import { ReviewModel } from "../../shared/models/Review";
import { CourseModel } from "../../shared/models/Course";
import { EnrollmentModel } from "../../shared/models/Enrollment";
import { notify } from "../notification/notification.service";

interface RatingSummary {
  average: number;
  count: number;
  breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
}

const emptyBreakdown = (): RatingSummary["breakdown"] => ({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 });

/** Recompute the denormalized rating fields on the course from visible reviews. */
async function syncCourseRating(courseId: string): Promise<RatingSummary> {
  const rows = await ReviewModel.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), isHidden: false } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const breakdown = emptyBreakdown();
  let total = 0;
  let sum = 0;
  for (const row of rows as { _id: number; count: number }[]) {
    const key = String(row._id) as keyof RatingSummary["breakdown"];
    if (key in breakdown) breakdown[key] = row.count;
    total += row.count;
    sum += row._id * row.count;
  }

  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

  await CourseModel.findByIdAndUpdate(courseId, {
    ratingAverage: average,
    ratingCount: total,
  });

  return { average, count: total, breakdown };
}

async function getSummary(courseId: string): Promise<RatingSummary> {
  const rows = await ReviewModel.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), isHidden: false } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const breakdown = emptyBreakdown();
  let total = 0;
  let sum = 0;
  for (const row of rows as { _id: number; count: number }[]) {
    const key = String(row._id) as keyof RatingSummary["breakdown"];
    if (key in breakdown) breakdown[key] = row.count;
    total += row.count;
    sum += row._id * row.count;
  }

  return {
    average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    count: total,
    breakdown,
  };
}

export async function listCourseReviews(
  courseId: string,
  page: number,
  limit: number,
  requester?: { userId: string; role?: string }
) {
  await connectToDB();

  const isStaff = requester?.role === "admin" || requester?.role === "superAdmin";
  const filter: Record<string, unknown> = { course: courseId };
  if (!isStaff) filter.isHidden = false;

  const skip = (page - 1) * limit;

  const [reviews, total, summary, myReview] = await Promise.all([
    ReviewModel.find(filter)
      .populate("student", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ReviewModel.countDocuments(filter),
    getSummary(courseId),
    requester
      ? ReviewModel.findOne({ course: courseId, student: requester.userId }).lean()
      : null,
  ]);

  return {
    reviews,
    summary,
    myReview,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/** Whether the requester is allowed to post a review for this course. */
export async function getReviewEligibility(courseId: string, userId: string) {
  await connectToDB();

  const enrollment = await EnrollmentModel.findOne({
    student: userId,
    course: courseId,
  }).lean();

  const myReview = await ReviewModel.findOne({ course: courseId, student: userId }).lean();

  return {
    canReview: !!enrollment,
    hasReviewed: !!myReview,
    myReview,
  };
}

export async function upsertReview(
  courseId: string,
  userId: string,
  data: { rating: number; comment: string }
) {
  await connectToDB();

  const course = await CourseModel.findById(courseId).select("title teacher");
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  // Reviewing requires a real enrollment, but an expired one still counts —
  // students often finish a course and review it after access lapses.
  const enrollment = await EnrollmentModel.findOne({ student: userId, course: courseId });
  if (!enrollment) {
    throw { status: 403, message: "শুধুমাত্র এনরোল্ড শিক্ষার্থী রিভিউ দিতে পারেন" };
  }

  const existing = await ReviewModel.findOne({ course: courseId, student: userId });

  let review;
  if (existing) {
    existing.rating = data.rating;
    existing.comment = data.comment;
    await existing.save();
    review = existing;
  } else {
    review = await ReviewModel.create({
      course: courseId,
      student: userId,
      rating: data.rating,
      comment: data.comment,
    });

    await notify({
      user: String(course.teacher),
      type: "review",
      title: "নতুন কোর্স রিভিউ",
      message: `"${course.title}" কোর্সে একজন শিক্ষার্থী ${data.rating} স্টার রিভিউ দিয়েছেন`,
      link: `/courses/${courseId}#reviews`,
    });
  }

  const summary = await syncCourseRating(courseId);

  return {
    message: existing ? "রিভিউ আপডেট করা হয়েছে" : "রিভিউ জমা দেওয়া হয়েছে",
    review,
    summary,
  };
}

export async function deleteReview(reviewId: string, userId: string, role: string) {
  await connectToDB();

  const review = await ReviewModel.findById(reviewId);
  if (!review) {
    throw { status: 404, message: "রিভিউ পাওয়া যায়নি" };
  }

  const isStaff = role === "admin" || role === "superAdmin";
  if (!isStaff && String(review.student) !== userId) {
    throw { status: 403, message: "অনুমতি নেই" };
  }

  const courseId = String(review.course);
  await ReviewModel.findByIdAndDelete(reviewId);
  await syncCourseRating(courseId);

  return { message: "রিভিউ মুছে ফেলা হয়েছে" };
}

// ============ Admin moderation ============

export async function listAllReviews(params: { page: number; limit: number; hidden?: string }) {
  await connectToDB();

  const filter: Record<string, unknown> = {};
  if (params.hidden === "true") filter.isHidden = true;
  if (params.hidden === "false") filter.isHidden = false;

  const skip = (params.page - 1) * params.limit;

  const [reviews, total] = await Promise.all([
    ReviewModel.find(filter)
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean(),
    ReviewModel.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
    },
  };
}

export async function setReviewVisibility(reviewId: string, isHidden: boolean, adminId: string) {
  await connectToDB();

  const review = await ReviewModel.findById(reviewId);
  if (!review) {
    throw { status: 404, message: "রিভিউ পাওয়া যায়নি" };
  }

  review.isHidden = isHidden;
  review.hiddenBy = isHidden ? (adminId as never) : undefined;
  await review.save();

  await syncCourseRating(String(review.course));

  return {
    message: isHidden ? "রিভিউ লুকানো হয়েছে" : "রিভিউ প্রকাশ করা হয়েছে",
    review,
  };
}
