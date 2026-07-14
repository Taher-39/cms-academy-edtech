import bcrypt from "bcryptjs";
import { connectToDB } from "../../shared/lib/db";
import { UserModel } from "../../shared/models/User";
import { generateOtp, setOtp, verifyOtp } from "../../shared/lib/otp";
import { signJwt } from "../../shared/lib/jwt";
import { sendOtpEmail } from "../../shared/utils/emailService";
import { verifyGoogleIdToken } from "../../shared/config/firebaseAdmin";
import cloudinary from "../../shared/config/cloudinary";

// ---------- Super Admin Bootstrap ----------
/** Auto-promotes a user to superAdmin if their email is listed in SUPER_ADMIN_EMAILS. */
async function maybePromoteSuperAdmin(user: any) {
  const list = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (list.includes(user.email.toLowerCase()) && user.role !== "superAdmin") {
    user.role = "superAdmin";
    await user.save();
  }

  return user;
}

// ---------- Register ----------
export async function registerUser(name: string, email: string, password: string) {
  await connectToDB();

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw { status: 409, message: "এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const otp = generateOtp();
  setOtp(email, otp);

  const tempKey = `temp_reg_${email.toLowerCase()}`;
  if (!global.__tempRegStore) global.__tempRegStore = new Map();
  global.__tempRegStore.set(tempKey, {
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  await sendOtpEmail(email, otp);

  return { message: "রেজিস্ট্রেশন সফল। আপনার ইমেইলে OTP পাঠানো হয়েছে।", email };
}

// ---------- Verify OTP ----------
export async function verifyUserOtp(email: string, otp: string) {
  if (!verifyOtp(email, otp)) {
    throw { status: 400, message: "OTP ভুল বা মেয়াদোত্তীর্ণ" };
  }

  await connectToDB();

  let user = await UserModel.findOne({ email: email.toLowerCase() });
  if (user && user.isVerified) {
    throw { status: 400, message: "এই অ্যাকাউন্ট ইতিমধ্যে ভেরিফাইড" };
  }

  if (user && !user.isVerified) {
    user.isVerified = true;
    await user.save();
  } else {
    const tempKey = `temp_reg_${email.toLowerCase()}`;
    const tempData = global.__tempRegStore?.get(tempKey);
    if (!tempData) {
      throw {
        status: 400,
        message: "রেজিস্ট্রেশন ডাটা পাওয়া যায়নি। আবার রেজিস্ট্রেশন করুন।",
      };
    }

    user = await UserModel.create({
      name: tempData.name,
      email: tempData.email,
      password: tempData.password,
      isVerified: true,
      role: "student",
    });

    global.__tempRegStore?.delete(tempKey);
  }

  user = await maybePromoteSuperAdmin(user);

  const token = signJwt({
    userId: user!._id.toString(),
    role: user!.role,
    email: user!.email,
  });

  return {
    message: "ভেরিফিকেশন সফল",
    token,
    user: {
      _id: user!._id.toString(),
      name: user!.name,
      email: user!.email,
      role: user!.role,
      isVerified: user!.isVerified,
    },
  };
}

// ---------- Login ----------
export async function loginUser(email: string, password: string) {
  await connectToDB();

  let user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw { status: 401, message: "ভুল ইমেইল বা পাসওয়ার্ড" };
  }

  if (!user.password) {
    throw {
      status: 400,
      message: "এই অ্যাকাউন্টটি Google দিয়ে তৈরি। অনুগ্রহ করে Google লগইন ব্যবহার করুন।",
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: "ভুল ইমেইল বা পাসওয়ার্ড" };
  }

  if (!user.isVerified) {
    throw {
      status: 403,
      message: "অ্যাকাউন্ট ভেরিফাই করা হয়নি। অনুগ্রহ করে ইমেইল চেক করুন।",
    };
  }

  user = await maybePromoteSuperAdmin(user);

  const token = signJwt({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return {
    message: "লগইন সফল",
    token,
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
    },
  };
}

// ---------- Google Auth ----------
export async function googleAuth(idToken: string) {
  let decoded;
  try {
    decoded = await verifyGoogleIdToken(idToken);
  } catch {
    throw { status: 401, message: "অবৈধ বা মেয়াদোত্তীর্ণ Google token" };
  }

  const { email, name, uid, picture } = decoded;
  const displayName = name || email?.split("@")[0] || "User";

  await connectToDB();

  let user = await UserModel.findOne({
    $or: [{ googleId: uid }, { email: email?.toLowerCase() }],
  });

  if (user) {
    if (!user.googleId) user.googleId = uid;
    if (!user.isVerified) user.isVerified = true;
    await user.save();
  } else {
    user = await UserModel.create({
      name: displayName,
      email: email?.toLowerCase(),
      googleId: uid,
      isVerified: true,
      role: "student",
    });
  }

  user = await maybePromoteSuperAdmin(user);

  const token = signJwt({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return {
    message: "Google লগইন সফল",
    token,
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      picture: picture || null,
    },
  };
}

// ---------- Forgot Password ----------
export async function forgotPassword(email: string) {
  await connectToDB();

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw { status: 404, message: "এই ইমেইলে কোনো অ্যাকাউন্ট নেই" };
  }

  const otp = generateOtp();
  setOtp(email, otp);
  await sendOtpEmail(email, otp);

  return {
    message: "পাসওয়ার্ড রিসেট OTP আপনার ইমেইলে পাঠানো হয়েছে",
    email,
  };
}

// ---------- Reset Password ----------
export async function resetPassword(email: string, otp: string, newPassword: string) {
  if (!verifyOtp(email, otp)) {
    throw { status: 400, message: "OTP ভুল বা মেয়াদোত্তীর্ণ" };
  }

  await connectToDB();

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await UserModel.findOneAndUpdate(
    { email: email.toLowerCase() },
    { password: hashedPassword }
  );

  return { message: "পাসওয়ার্ড রিসেট সফল" };
}

// ---------- Change Password ----------
export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  await connectToDB();

  const user = await UserModel.findById(userId);
  if (!user) {
    throw { status: 404, message: "ব্যবহারকারী পাওয়া যায়নি" };
  }

  if (!user.password) {
    throw {
      status: 400,
      message: "Google অ্যাকাউন্টের জন্য পাসওয়ার্ড পরিবর্তন সম্ভব নয়",
    };
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw { status: 400, message: "পুরনো পাসওয়ার্ড ভুল" };
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return { message: "পাসওয়ার্ড পরিবর্তন সফল" };
}

// ---------- Update Profile ----------
export async function updateProfile(
  userId: string,
  data: { name?: string; phone?: string }
) {
  await connectToDB();

  const user = await UserModel.findById(userId);
  if (!user) {
    throw { status: 404, message: "ব্যবহারকারী পাওয়া যায়নি" };
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  await user.save();

  return {
    message: "প্রোফাইল আপডেট সফল",
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
      avatar: user.avatar,
    },
  };
}

// ---------- Upload Avatar ----------
export async function uploadAvatar(userId: string, fileBuffer: Buffer) {
  await connectToDB();

  const user = await UserModel.findById(userId);
  if (!user) {
    throw { status: 404, message: "ব্যবহারকারী পাওয়া যায়নি" };
  }

  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "cms-academy/avatars", resource_type: "image" },
      (error: unknown, result: { secure_url: string } | undefined) => {
        if (error || !result) return reject(error || new Error("Upload failed"));
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });

  user.avatar = uploadResult.secure_url;
  await user.save();

  return {
    message: "প্রোফাইল ছবি আপলোড সফল",
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
      avatar: user.avatar,
    },
  };
}
