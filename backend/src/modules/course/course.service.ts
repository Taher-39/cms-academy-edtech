import { connectToDB } from "../../shared/lib/db";
import { CourseModel } from "../../shared/models/Course";
import { LectureModel } from "../../shared/models/Lecture";
import { LiveClassModel } from "../../shared/models/LiveClass";
import { QnAModel } from "../../shared/models/QnA";
import { EnrollmentModel } from "../../shared/models/Enrollment";

// ============ Courses ============

interface ListCoursesParams {
  category?: string;
  classLevel?: string;
  type?: string;
  free?: string;
  search?: string;
  status?: string;
  featured?: string;
  page: number;
  limit: number;
}

interface Requester {
  userId: string;
  role?: string;
}

export async function listCourses(params: ListCoursesParams, requester?: Requester) {
  await connectToDB();

  const filter: Record<string, unknown> = {};
  if (params.category) filter.category = params.category;
  if (params.classLevel) filter.classLevel = params.classLevel;
  if (params.type) filter.type = params.type;
  if (params.free === "true") filter.price = 0;
  if (params.free === "false") filter.price = { $gt: 0 };
  if (params.search) filter.title = { $regex: params.search, $options: "i" };
  if (params.featured === "true") filter.isFeatured = true;

  const isAdmin = requester?.role === "admin" || requester?.role === "superAdmin";

  if (isAdmin) {
    if (params.status) filter.status = params.status;
  } else if (requester?.role === "teacher") {
    filter.$or = [{ status: "approved" }, { teacher: requester.userId }];
  } else {
    filter.status = "approved";
  }

  const skip = (params.page - 1) * params.limit;

  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .populate("teacher", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean(),
    CourseModel.countDocuments(filter),
  ]);

  return {
    courses,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
    },
  };
}

export async function getCourseById(courseId: string) {
  await connectToDB();

  const course = await CourseModel.findById(courseId)
    .populate("teacher", "name email")
    .populate({ path: "lectures", options: { sort: { order: 1 } } })
    .lean();

  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  return { course };
}

export async function createCourse(data: any, teacherId: string) {
  await connectToDB();

  const courseData: Record<string, unknown> = { ...data, teacher: teacherId };

  // Convert valid date strings; remove empty/invalid ones
  if (typeof courseData.enrollStartDate === "string") {
    if (courseData.enrollStartDate.trim()) {
      courseData.enrollStartDate = new Date(courseData.enrollStartDate as string);
    } else {
      delete courseData.enrollStartDate;
    }
  }
  if (typeof courseData.enrollEndDate === "string") {
    if (courseData.enrollEndDate.trim()) {
      courseData.enrollEndDate = new Date(courseData.enrollEndDate as string);
    } else {
      delete courseData.enrollEndDate;
    }
  }

  const course = await CourseModel.create(courseData);
  return { message: "কোর্স তৈরি সফল", course };
}

export async function updateCourse(courseId: string, body: any, userId: string, role: string) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  if (role !== "admin" && role !== "superAdmin" && course.teacher.toString() !== userId) {
    throw { status: 403, message: "আপনার এই কোর্স সম্পাদনার অনুমতি নেই" };
  }

  if (role !== "admin" && role !== "superAdmin") {
    delete body.status;
    delete body.isFeatured;
  }

  const updated = await CourseModel.findByIdAndUpdate(courseId, body, {
    new: true,
    runValidators: true,
  });

  return { message: "কোর্স আপডেট সফল", course: updated };
}

export async function deleteCourse(courseId: string, userId: string, role: string) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  if (role !== "admin" && role !== "superAdmin" && course.teacher.toString() !== userId) {
    throw { status: 403, message: "আপনার এই কোর্স মুছে ফেলার অনুমতি নেই" };
  }

  await CourseModel.findByIdAndDelete(courseId);
  return { message: "কোর্স মুছে ফেলা হয়েছে" };
}

// ============ Lectures ============

export async function listLectures(courseId: string, userId?: string, role?: string) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  const lectures = await LectureModel.find({ course: courseId })
    .sort({ order: 1 })
    .lean();

  if (!userId) {
    return { lectures: lectures.filter((l) => l.isFree), isEnrolled: false };
  }

  if (role === "admin" || role === "superAdmin" || role === "teacher") {
    return { lectures, isEnrolled: true };
  }

  const enrollment = await EnrollmentModel.findOne({
    student: userId,
    course: courseId,
    expiryAt: { $gt: new Date() },
  });

  const isEnrolled = !!enrollment;

  if (!isEnrolled) {
    return { lectures: lectures.filter((l) => l.isFree), isEnrolled: false };
  }

  return { lectures, isEnrolled: true };
}

export async function createLecture(courseId: string, data: any, userId: string, role: string) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  if (role !== "admin" && role !== "superAdmin" && course.teacher.toString() !== userId) {
    throw { status: 403, message: "শুধুমাত্র শিক্ষক লেকচার যোগ করতে পারেন" };
  }

  const lastLecture = await LectureModel.findOne({ course: courseId })
    .sort({ order: -1 })
    .select("order");

  const nextOrder = lastLecture ? lastLecture.order + 1 : 1;
  const isFree = data.isFree !== undefined ? data.isFree : nextOrder <= 3;

  const lecture = await LectureModel.create({
    course: courseId,
    title: data.title,
    description: data.description,
    videoUrl: data.videoUrl,
    noteUrl: data.noteUrl,
    order: nextOrder,
    isFree,
  });

  await CourseModel.findByIdAndUpdate(courseId, {
    $push: { lectures: lecture._id },
  });

  return { message: "লেকচার যোগ করা হয়েছে", lecture };
}

export async function updateLecture(
  courseId: string,
  lectureId: string,
  data: any,
  userId: string,
  role: string
) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  if (role !== "admin" && role !== "superAdmin" && course.teacher.toString() !== userId) {
    throw { status: 403, message: "শুধুমাত্র শিক্ষক লেকচার এডিট করতে পারেন" };
  }

  const lecture = await LectureModel.findByIdAndUpdate(lectureId, data, {
    new: true,
    runValidators: true,
  });

  if (!lecture) {
    throw { status: 404, message: "লেকচার পাওয়া যায়নি" };
  }

  return { message: "লেকচার আপডেট করা হয়েছে", lecture };
}

export async function deleteLecture(
  courseId: string,
  lectureId: string,
  userId: string,
  role: string
) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  if (role !== "admin" && role !== "superAdmin" && course.teacher.toString() !== userId) {
    throw { status: 403, message: "শুধুমাত্র শিক্ষক লেকচার মুছতে পারেন" };
  }

  const lecture = await LectureModel.findByIdAndDelete(lectureId);
  if (!lecture) {
    throw { status: 404, message: "লেকচার পাওয়া যায়নি" };
  }

  await CourseModel.findByIdAndUpdate(courseId, {
    $pull: { lectures: lectureId },
  });

  return { message: "লেকচার মুছে ফেলা হয়েছে" };
}

// ============ Live Classes ============

export async function listLiveClasses(courseId: string) {
  await connectToDB();

  const liveClasses = await LiveClassModel.find({
    course: courseId,
    dateTime: { $gte: new Date() },
  })
    .sort({ dateTime: 1 })
    .populate("recordedLecture", "title videoUrl")
    .lean();

  return { liveClasses };
}

export async function createLiveClass(courseId: string, data: any, userId: string, role: string) {
  await connectToDB();

  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  if (role !== "admin" && role !== "superAdmin" && course.teacher.toString() !== userId) {
    throw { status: 403, message: "শুধুমাত্র শিক্ষক লাইভ ক্লাস তৈরি করতে পারেন" };
  }

  const liveClass = await LiveClassModel.create({
    course: courseId,
    title: data.title,
    dateTime: new Date(data.dateTime),
    meetLink: data.meetLink,
  });

  return { message: "লাইভ ক্লাস তৈরি করা হয়েছে", liveClass };
}

// ============ Q&A ============

export async function listQnA(courseId: string, userId: string, role: string) {
  await connectToDB();

  const isEnrolled = await EnrollmentModel.findOne({
    student: userId,
    course: courseId,
    expiryAt: { $gt: new Date() },
  });

  if (!isEnrolled && role !== "admin" && role !== "superAdmin" && role !== "teacher") {
    throw { status: 403, message: "শুধুমাত্র এনরোল্ড শিক্ষার্থী Q&A দেখতে পারেন", qna: [] };
  }

  const filter: Record<string, unknown> = { course: courseId };
  if (role !== "admin" && role !== "superAdmin" && role !== "teacher") {
    filter.student = userId;
  }

  const qna = await QnAModel.find(filter)
    .populate("student", "name email")
    .populate("answers.teacher", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return { qna };
}

export async function askQuestion(courseId: string, userId: string, question: string) {
  await connectToDB();

  const isEnrolled = await EnrollmentModel.findOne({
    student: userId,
    course: courseId,
    expiryAt: { $gt: new Date() },
  });

  if (!isEnrolled) {
    throw { status: 403, message: "শুধুমাত্র এনরোল্ড শিক্ষার্থী প্রশ্ন করতে পারেন" };
  }

  const qna = await QnAModel.create({
    course: courseId,
    student: userId,
    question,
  });

  return { message: "প্রশ্ন জমা দেওয়া হয়েছে", qna };
}
