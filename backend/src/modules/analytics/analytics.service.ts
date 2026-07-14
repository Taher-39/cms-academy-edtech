import { connectToDB } from "../../shared/lib/db";
import { EnrollmentModel } from "../../shared/models/Enrollment";
import { CourseModel } from "../../shared/models/Course";
import { UserModel } from "../../shared/models/User";

export async function getSummary() {
  await connectToDB();

  const [
    revenueAgg,
    activeStudents,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalEnrollments,
  ] = await Promise.all([
    EnrollmentModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]),
    EnrollmentModel.distinct("student", { expiryAt: { $gt: new Date() } }),
    UserModel.countDocuments({ role: "student" }),
    UserModel.countDocuments({ role: "teacher" }),
    CourseModel.countDocuments({}),
    EnrollmentModel.countDocuments({}),
  ]);

  return {
    totalRevenue: revenueAgg[0]?.total || 0,
    activeStudents: activeStudents.length,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalEnrollments,
  };
}

export async function getTopCourses(limit: number) {
  await connectToDB();

  const topCourses = await EnrollmentModel.aggregate([
    { $match: { paymentStatus: "paid" } },
    {
      $group: {
        _id: "$course",
        revenue: { $sum: "$paidAmount" },
        enrollments: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    {
      $project: {
        _id: 0,
        courseId: "$_id",
        title: "$course.title",
        revenue: 1,
        enrollments: 1,
      },
    },
  ]);

  return { topCourses };
}

export async function getRevenueTrend(months: number) {
  await connectToDB();

  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const rows = await EnrollmentModel.aggregate([
    { $match: { paymentStatus: "paid", enrolledAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: "$enrolledAt" }, month: { $month: "$enrolledAt" } },
        revenue: { $sum: "$paidAmount" },
      },
    },
  ]);

  const byKey = new Map(rows.map((r) => [`${r._id.year}-${r._id.month}`, r.revenue]));

  const trend: { label: string; revenue: number }[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < months; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
    trend.push({
      label: cursor.toLocaleDateString("bn-BD", { year: "numeric", month: "short" }),
      revenue: byKey.get(key) || 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { trend };
}
