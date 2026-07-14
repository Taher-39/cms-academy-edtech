import { connectToDB } from "../../shared/lib/db";
import { CourseModel } from "../../shared/models/Course";
import { EnrollmentModel } from "../../shared/models/Enrollment";
import { UserModel } from "../../shared/models/User";
import { sslcommerz, getSslcommerzInitData } from "../../shared/config/sslcommerz";
import { validateAndComputeCouponDiscount, incrementCouponUsage } from "../coupon/coupon.service";

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
  const { tran_id, courseId, discount, val_id, bank_tran_id } = query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (!tran_id || !courseId) {
    return { redirect: `${frontendUrl}/payment/failed` };
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
    return { redirect: `${frontendUrl}/payment/failed` };
  }

  const userId = trxData?.userId;
  const paidAmount = trxData?.amount || 0;

  if (userId) {
    await connectToDB();

    const existing = await EnrollmentModel.findOne({ student: userId, course: courseId });
    if (!existing) {
      await EnrollmentModel.create({
        student: userId,
        course: courseId,
        paidAmount,
        discountApplied: parseInt((discount as string) || "0"),
        transactionId: tran_id,
        valId: val_id,
        bankTransactionId: bank_tran_id,
        couponCode: trxData?.couponCode,
        paymentStatus: "paid",
      });

      await CourseModel.findByIdAndUpdate(courseId, {
        $addToSet: { enrolledStudents: userId },
      });

      await UserModel.findByIdAndUpdate(userId, {
        $addToSet: { enrolledCourses: courseId },
      });

      if (trxData?.couponCode) {
        await incrementCouponUsage(trxData.couponCode);
      }
    }

    global.__trxStore?.delete(trxKey);
  }

  return { redirect: `${frontendUrl}/courses/${courseId}?payment=success` };
}
