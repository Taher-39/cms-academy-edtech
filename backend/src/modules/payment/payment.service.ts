import { connectToDB } from "../../shared/lib/db";
import { CourseModel } from "../../shared/models/Course";
import { EnrollmentModel } from "../../shared/models/Enrollment";
import { UserModel } from "../../shared/models/User";
import { OneToOneSessionModel } from "../../shared/models/OneToOneSession";
import { sslcommerz, getSslcommerzInitData } from "../../shared/config/sslcommerz";
import { validateAndComputeCouponDiscount, incrementCouponUsage } from "../coupon/coupon.service";

export const SESSION_PRICE_PER_HOUR = 200;

export async function initPayment(
  userId: string,
  email: string,
  courseId: string,
  couponCode?: string
) {
  await connectToDB();

  const course = await CourseModel.findById(courseId).populate("teacher", "name email");
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }

  if ((course as unknown as { status?: string }).status && (course as unknown as { status?: string }).status !== "approved") {
    throw { status: 400, message: "এই কোর্সটি বর্তমানে উপলব্ধ নয়" };
  }

  if (course.price === 0) {
    throw { status: 400, message: "এই কোর্সটি ফ্রি, পেমেন্টের প্রয়োজন নেই" };
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

  const anyPreviousEnrollment = await EnrollmentModel.findOne({ student: userId });
  const previousDiscount = anyPreviousEnrollment ? 200 : 0;

  let couponDiscount = 0;
  if (couponCode) {
    const result = await validateAndComputeCouponDiscount(couponCode, course.price);
    couponDiscount = result.discountAmount;
  }

  const discount = Math.max(previousDiscount, couponDiscount);
  const winningCouponCode = couponCode && couponDiscount >= previousDiscount ? couponCode : undefined;

  const finalAmount = Math.max(0, course.price - discount);
  const tran_id = `CMS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

  const initData = getSslcommerzInitData({
    total_amount: finalAmount,
    tran_id,
    success_url: `${backendUrl}/api/payment/success?tran_id=${tran_id}&courseId=${courseId}&discount=${discount}`,
    fail_url: `${backendUrl}/api/payment/fail?courseId=${courseId}`,
    cancel_url: `${backendUrl}/api/payment/cancel?courseId=${courseId}`,
    cus_name: email || "Student",
    cus_email: email || "student@example.com",
    product_name: course.title,
  });

  const response = await sslcommerz.init(initData);

  if (response.status === "SUCCESS" || response.GatewayPageURL) {
    const trxKey = `trx_${tran_id}`;
    if (!global.__trxStore) global.__trxStore = new Map();
    global.__trxStore.set(trxKey, {
      type: "course",
      userId,
      courseId,
      amount: finalAmount,
      discount,
      tran_id,
      couponCode: winningCouponCode,
    });

    return { url: response.GatewayPageURL, tran_id };
  }

  throw { status: 500, message: "পেমেন্ট ইনিশিয়ালাইজেশন ব্যর্থ" };
}

export async function initSessionPayment(
  userId: string,
  email: string,
  data: {
    teacherId: string;
    subject: string;
    topics: string;
    requestedSchedule: string;
    durationHours: number;
  }
) {
  await connectToDB();

  const teacher = await UserModel.findById(data.teacherId).select("role name");
  if (!teacher || teacher.role !== "teacher") {
    throw { status: 400, message: "নির্বাচিত শিক্ষক পাওয়া যায়নি" };
  }

  const schedule = new Date(data.requestedSchedule);
  if (isNaN(schedule.getTime()) || schedule.getTime() <= Date.now()) {
    throw { status: 400, message: "সময়সূচী সঠিক নয় — ভবিষ্যতের একটি সময় দিন" };
  }

  const amount = SESSION_PRICE_PER_HOUR * data.durationHours;
  const tran_id = `CMS-SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

  const initData = getSslcommerzInitData({
    total_amount: amount,
    tran_id,
    success_url: `${backendUrl}/api/payment/success?tran_id=${tran_id}&type=session`,
    fail_url: `${backendUrl}/api/payment/fail?type=session`,
    cancel_url: `${backendUrl}/api/payment/cancel?type=session`,
    cus_name: email || "Student",
    cus_email: email || "student@example.com",
    product_name: `১-এক-১ সেশন — ${data.subject}`,
  });

  const response = await sslcommerz.init(initData);

  if (response.status === "SUCCESS" || response.GatewayPageURL) {
    const trxKey = `trx_${tran_id}`;
    if (!global.__trxStore) global.__trxStore = new Map();
    global.__trxStore.set(trxKey, {
      type: "session",
      userId,
      amount,
      discount: 0,
      tran_id,
      teacherId: data.teacherId,
      subject: data.subject,
      topics: data.topics,
      requestedSchedule: data.requestedSchedule,
      durationHours: data.durationHours,
      pricePerHour: SESSION_PRICE_PER_HOUR,
    });

    return { url: response.GatewayPageURL, tran_id };
  }

  throw { status: 500, message: "পেমেন্ট ইনিশিয়ালাইজেশন ব্যর্থ" };
}

type TrxData = NonNullable<ReturnType<typeof global.__trxStore.get>>;

async function createSessionFromTrxData(trxData: TrxData, valId?: string, bankTranId?: string) {
  const existing = await OneToOneSessionModel.findOne({ transactionId: trxData.tran_id });
  if (existing) return existing;

  return OneToOneSessionModel.create({
    student: trxData.userId,
    teacher: trxData.teacherId,
    subject: trxData.subject,
    topics: trxData.topics,
    requestedSchedule: new Date(trxData.requestedSchedule!),
    durationHours: trxData.durationHours,
    pricePerHour: trxData.pricePerHour,
    amount: trxData.amount,
    status: "awaiting_teacher",
    transactionId: trxData.tran_id,
    valId,
    bankTransactionId: bankTranId,
  });
}

export async function handleIpn(body: any) {
  const tran_id = body.tran_id as string;
  const status = body.status as string;

  if (status !== "VALID" && status !== "VALIDATED") {
    return { message: "Invalid transaction" };
  }

  const trxKey = `trx_${tran_id}`;
  const trxData = global.__trxStore?.get(trxKey);
  if (!trxData) {
    return { message: "Transaction data not found" };
  }

  await connectToDB();

  if (trxData.type === "session") {
    await createSessionFromTrxData(trxData, body.val_id, body.bank_tran_id);
    global.__trxStore?.delete(trxKey);
    return { message: "IPN processed successfully" };
  }

  const existing = await EnrollmentModel.findOne({
    student: trxData.userId,
    course: trxData.courseId,
  });

  if (!existing) {
    await EnrollmentModel.create({
      student: trxData.userId,
      course: trxData.courseId,
      paidAmount: trxData.amount,
      discountApplied: trxData.discount,
      transactionId: trxData.tran_id,
      valId: body.val_id,
      bankTransactionId: body.bank_tran_id,
      couponCode: trxData.couponCode,
      paymentStatus: "paid",
    });

    await CourseModel.findByIdAndUpdate(trxData.courseId, {
      $addToSet: { enrolledStudents: trxData.userId },
    });

    await UserModel.findByIdAndUpdate(trxData.userId, {
      $addToSet: { enrolledCourses: trxData.courseId },
    });

    if (trxData.couponCode) {
      await incrementCouponUsage(trxData.couponCode);
    }
  }

  global.__trxStore?.delete(trxKey);
  return { message: "IPN processed successfully" };
}

export async function handlePaymentSuccess(query: any) {
  const { tran_id, courseId, type: queryType, discount, val_id, bank_tran_id } = query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const isSessionFlow = queryType === "session";

  if (!tran_id) {
    return { redirect: `${frontendUrl}/dashboard?payment=failed` };
  }

  let isValid = false;
  try {
    const validation = await sslcommerz.validate((val_id as string) || "", tran_id as string);
    isValid = validation.status === "VALID" || validation.status === "VALIDATED";
  } catch {
    isValid = !!val_id;
  }

  const trxKey = `trx_${tran_id}`;
  const trxData = global.__trxStore?.get(trxKey);

  if (!trxData && !isValid) {
    return {
      redirect: isSessionFlow
        ? `${frontendUrl}/dashboard/sessions?payment=failed`
        : `${frontendUrl}/courses/${courseId || ""}?payment=failed`,
    };
  }

  if (trxData?.type === "session" || (!trxData && isSessionFlow)) {
    if (trxData) {
      await connectToDB();
      await createSessionFromTrxData(trxData, val_id, bank_tran_id);
      global.__trxStore?.delete(trxKey);
    }
    return { redirect: `${frontendUrl}/dashboard/sessions?payment=success` };
  }

  const userId = trxData?.userId;
  const paidAmount = trxData?.amount || 0;
  const targetCourseId = courseId || trxData?.courseId;

  if (userId && targetCourseId) {
    await connectToDB();

    const existing = await EnrollmentModel.findOne({ student: userId, course: targetCourseId });
    if (!existing) {
      await EnrollmentModel.create({
        student: userId,
        course: targetCourseId,
        paidAmount,
        discountApplied: parseInt((discount as string) || "0"),
        transactionId: tran_id,
        valId: val_id,
        bankTransactionId: bank_tran_id,
        couponCode: trxData?.couponCode,
        paymentStatus: "paid",
      });

      await CourseModel.findByIdAndUpdate(targetCourseId, {
        $addToSet: { enrolledStudents: userId },
      });

      await UserModel.findByIdAndUpdate(userId, {
        $addToSet: { enrolledCourses: targetCourseId },
      });

      if (trxData?.couponCode) {
        await incrementCouponUsage(trxData.couponCode);
      }
    }

    global.__trxStore?.delete(trxKey);
  }

  return { redirect: `${frontendUrl}/courses/${targetCourseId || ""}?payment=success` };
}
