import mongoose, { InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const userRoles = ["student", "teacher", "admin", "superAdmin"] as const;
export type UserRole = (typeof userRoles)[number];

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: false },
    role: {
      type: String,
      required: true,
      enum: userRoles,
      default: "student",
    },
    googleId: { type: String, required: false, unique: true, sparse: true, index: true },
    phone: { type: String, required: false, trim: true },
    avatar: { type: String, required: false },
    isVerified: { type: Boolean, required: true, default: false },
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema>;
export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
