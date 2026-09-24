import crypto from "crypto";
import { connectToDB } from "../../shared/lib/db";
import { CertificateModel } from "../../shared/models/Certificate";
import { EnrollmentModel } from "../../shared/models/Enrollment";
import { CourseModel } from "../../shared/models/Course";
import { LectureModel } from "../../shared/models/Lecture";
import { UserModel } from "../../shared/models/User";
import { notify } from "../notification/notification.service";

function generateCertificateId() {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CMS-${new Date().getFullYear()}-${suffix}`;
}

/**
 * Issue a certificate for a completed enrollment, or return the existing one.
 * Returns null when the student hasn't watched every lecture yet, so callers
 * that run on progress updates can stay side-effect free.
 */
export async function issueIfCompleted(userId: string, courseId: string) {
  await connectToDB();

  const existing = await CertificateModel.findOne({ student: userId, course: courseId });
  if (existing) return existing;

  const enrollment = await EnrollmentModel.findOne({ student: userId, course: courseId });
  if (!enrollment) return null;

  const total = await LectureModel.countDocuments({ course: courseId });
  const watched = (enrollment.watchedLectures || []).length;
  if (total === 0 || watched < total) return null;

  const [course, student] = await Promise.all([
    CourseModel.findById(courseId).populate("teacher", "name").lean(),
    UserModel.findById(userId).select("name").lean(),
  ]);
  if (!course || !student) return null;

  const courseDoc = course as unknown as { title: string; teacher?: { name?: string } };

  let certificate;
  try {
    certificate = await CertificateModel.create({
      certificateId: generateCertificateId(),
      student: userId,
      course: courseId,
      enrollment: enrollment._id,
      studentName: (student as { name: string }).name,
      courseTitle: courseDoc.title,
      teacherName: courseDoc.teacher?.name,
      lecturesCompleted: watched,
      totalLectures: total,
    });
  } catch (error: any) {
    // Two concurrent progress updates can race on the student+course unique index.
    if (error?.code === 11000) {
      return CertificateModel.findOne({ student: userId, course: courseId });
    }
    throw error;
  }

  await notify({
    user: userId,
    type: "certificate",
    title: "অভিনন্দন! সার্টিফিকেট অর্জিত",
    message: `"${courseDoc.title}" কোর্স সম্পন্ন করার জন্য আপনার সার্টিফিকেট প্রস্তুত`,
    link: "/dashboard/certificates",
  });

  return certificate;
}

export async function claimCertificate(userId: string, courseId: string) {
  await connectToDB();

  const certificate = await issueIfCompleted(userId, courseId);
  if (!certificate) {
    throw { status: 400, message: "সব লেকচার সম্পন্ন করার পর সার্টিফিকেট পাওয়া যাবে" };
  }

  return { message: "সার্টিফিকেট প্রস্তুত", certificate };
}

export async function listMyCertificates(userId: string) {
  await connectToDB();

  const certificates = await CertificateModel.find({ student: userId, revokedAt: null })
    .populate("course", "title thumbnail")
    .sort({ issuedAt: -1 })
    .lean();

  return { certificates };
}

/** Public lookup used by the verification page — no auth, no personal contact data. */
export async function verifyCertificate(certificateId: string) {
  await connectToDB();

  const certificate = await CertificateModel.findOne({
    certificateId: certificateId.trim().toUpperCase(),
  })
    .select("certificateId studentName courseTitle teacherName lecturesCompleted totalLectures issuedAt revokedAt course")
    .populate("course", "title thumbnail classLevel subject")
    .lean();

  if (!certificate) {
    throw { status: 404, message: "এই আইডিতে কোনো সার্টিফিকেট পাওয়া যায়নি" };
  }

  const cert = certificate as unknown as { revokedAt?: Date };

  return { valid: !cert.revokedAt, certificate };
}

// ============ Admin ============

export async function listAllCertificates(params: { page: number; limit: number }) {
  await connectToDB();

  const skip = (params.page - 1) * params.limit;

  const [certificates, total] = await Promise.all([
    CertificateModel.find()
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean(),
    CertificateModel.countDocuments(),
  ]);

  return {
    certificates,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
    },
  };
}

export async function setRevoked(certificateId: string, revoked: boolean) {
  await connectToDB();

  const certificate = await CertificateModel.findById(certificateId);
  if (!certificate) {
    throw { status: 404, message: "সার্টিফিকেট পাওয়া যায়নি" };
  }

  certificate.revokedAt = revoked ? new Date() : undefined;
  await certificate.save();

  return {
    message: revoked ? "সার্টিফিকেট বাতিল করা হয়েছে" : "সার্টিফিকেট পুনর্বহাল করা হয়েছে",
    certificate,
  };
}
