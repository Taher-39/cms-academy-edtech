import { connectToDB } from "../../shared/lib/db";
import { CouponModel } from "../../shared/models/Coupon";

export async function createCoupon(data: any, adminId: string) {
  await connectToDB();

  const existing = await CouponModel.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    throw { status: 409, message: "এই কোড ইতিমধ্যে ব্যবহৃত হয়েছে" };
  }

  const coupon = await CouponModel.create({
    ...data,
    code: data.code.toUpperCase(),
    validTill: new Date(data.validTill),
    createdBy: adminId,
  });

  return { message: "কুপন তৈরি করা হয়েছে", coupon };
}

export async function listCoupons() {
  await connectToDB();
  const coupons = await CouponModel.find({}).sort({ createdAt: -1 }).lean();
  return { coupons };
}

export async function updateCoupon(couponId: string, data: any) {
  await connectToDB();

  const body: Record<string, unknown> = { ...data };
  if (body.code) body.code = (body.code as string).toUpperCase();
  if (body.validTill) body.validTill = new Date(body.validTill as string);

  const coupon = await CouponModel.findByIdAndUpdate(couponId, body, {
    new: true,
    runValidators: true,
  });

  if (!coupon) {
    throw { status: 404, message: "কুপন পাওয়া যায়নি" };
  }

  return { message: "কুপন আপডেট করা হয়েছে", coupon };
}

export async function deleteCoupon(couponId: string) {
  await connectToDB();

  const coupon = await CouponModel.findByIdAndDelete(couponId);
  if (!coupon) {
    throw { status: 404, message: "কুপন পাওয়া যায়নি" };
  }

  return { message: "কুপন মুছে ফেলা হয়েছে" };
}

/** Validates a coupon code and computes its taka discount for a given course price. Throws on invalid/expired/exhausted. */
export async function validateAndComputeCouponDiscount(code: string, coursePrice: number) {
  await connectToDB();

  const coupon = await CouponModel.findOne({ code: code.toUpperCase() });
  if (!coupon || !coupon.isActive) {
    throw { status: 400, message: "কুপন কোড সঠিক নয়" };
  }
  if (coupon.validTill < new Date()) {
    throw { status: 400, message: "কুপনের মেয়াদ শেষ হয়ে গেছে" };
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    throw { status: 400, message: "কুপনের ব্যবহারসীমা শেষ হয়ে গেছে" };
  }

  const discountAmount =
    coupon.type === "percent"
      ? Math.round((coursePrice * coupon.discountAmount) / 100)
      : coupon.discountAmount;

  return { coupon, discountAmount: Math.min(discountAmount, coursePrice) };
}

export async function incrementCouponUsage(code: string) {
  await connectToDB();
  await CouponModel.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}
