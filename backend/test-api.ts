/**
 * API Route Test Script
 * 
 * Tests all backend routes by:
 * 1. Connecting to MongoDB directly to seed test users
 * 2. Generating JWT tokens manually
 * 3. Testing all CRUD operations on each module via HTTP
 * 
 * Run: npx tsx test-api.ts
 */

import dotenv from "dotenv";
dotenv.config();

import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserModel } from "./src/shared/models/User";
import { CourseModel } from "./src/shared/models/Course";
import { LectureModel } from "./src/shared/models/Lecture";
import { EnrollmentModel } from "./src/shared/models/Enrollment";
import { QnAModel } from "./src/shared/models/QnA";
import { LiveClassModel } from "./src/shared/models/LiveClass";

// --- Config ---
const MONGODB_URI = process.env.MONGODB_URI!;
const JWT_SECRET = process.env.JWT_SECRET!;
const BASE_URL = `http://localhost:${process.env.PORT || 4000}`;

let teacherToken: string, studentToken: string;
let courseId: string, lectureId: string, liveClassId: string, qnaId: string;

// --- Helpers ---
async function api(method: string, path: string, body: any = null, token: string | null = null) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch (err: any) {
    return { status: 0, ok: false, data: err.message };
  }
}

function log(label: string, result: { status: number; ok: boolean; data: any }) {
  const icon = result.ok ? "✅" : "❌";
  console.log(`\n${icon} ${label}`);
  console.log(`   Status: ${result.status}`);
  const str = JSON.stringify(result.data, null, 2);
  console.log(`   Response: ${str.slice(0, 400)}`);
  return result;
}

function generateToken(userId: string, role: string, email: string): string {
  return jwt.sign({ userId, role, email }, JWT_SECRET, { expiresIn: 604800 });
}

// --- Main Test ---
async function runTests() {
  console.log("=".repeat(60));
  console.log("🚀 CMS ACADEMY — API Route Test Suite");
  console.log("=".repeat(60));

  // ---------- 1. Connect to MongoDB ----------
  console.log("\n📦 Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (err: any) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }

  // Clean previous test data
  console.log("\n🧹 Cleaning previous test data...");
  await UserModel.deleteMany({ email: /^test-/ });
  await CourseModel.deleteMany({ title: /^Test/ });
  await LectureModel.deleteMany({ title: /^Test/ });
  await EnrollmentModel.deleteMany({});
  await QnAModel.deleteMany({});
  await LiveClassModel.deleteMany({});
  console.log("✅ Cleanup complete");

  // ---------- 2. Create Test Users ----------
  console.log("\n" + "=".repeat(60));
  console.log("📝 CREATE TEST USERS");
  console.log("=".repeat(60));

  const hashedPassword = await bcrypt.hash("test1234", 12);

  const teacher = await UserModel.create({
    name: "Test Teacher",
    email: "test-teacher@test.com",
    password: hashedPassword,
    role: "teacher",
    isVerified: true,
  });
  teacherToken = generateToken(teacher._id.toString(), "teacher", teacher.email);
  console.log(`✅ Teacher created: ${teacher.email} (role: teacher)`);

  const student = await UserModel.create({
    name: "Test Student",
    email: "test-student@test.com",
    password: hashedPassword,
    role: "student",
    isVerified: true,
  });
  studentToken = generateToken(student._id.toString(), "student", student.email);
  console.log(`✅ Student created: ${student.email} (role: student)`);

  // ====================================================================
  // 📚 AUTH MODULE — /api/auth
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 AUTH MODULE — /api/auth");
  console.log("=".repeat(60));

  // POST /api/auth/register
  let r = await api("POST", "/api/auth/register", {
    name: "Test New User",
    email: "test-newuser@test.com",
    password: "test1234",
  });
  log("POST /api/auth/register", r);

  // POST /api/auth/login
  r = await api("POST", "/api/auth/login", {
    email: "test-teacher@test.com",
    password: "test1234",
  });
  log("POST /api/auth/login", r);

  // POST /api/auth/login — wrong password
  r = await api("POST", "/api/auth/login", {
    email: "test-teacher@test.com",
    password: "wrongpassword",
  });
  log("POST /api/auth/login (wrong password)", r);

  // POST /api/auth/forgot-password
  r = await api("POST", "/api/auth/forgot-password", {
    email: "test-teacher@test.com",
  });
  log("POST /api/auth/forgot-password", r);

  // POST /api/auth/change-password (then revert)
  r = await api("POST", "/api/auth/change-password", {
    oldPassword: "test1234",
    newPassword: "test12345",
  }, teacherToken);
  log("POST /api/auth/change-password", r);

  // Revert password
  await api("POST", "/api/auth/change-password", {
    oldPassword: "test12345",
    newPassword: "test1234",
  }, teacherToken);

  // ====================================================================
  // 📚 COURSE MODULE — /api/courses
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 COURSE MODULE — /api/courses");
  console.log("=".repeat(60));

  // POST /api/courses — Teacher creates course
  r = await api("POST", "/api/courses", {
    title: "Test Course - Mathematics",
    description: "A comprehensive test course for SSC Mathematics",
    category: "academic",
    classLevel: "9-10",
    subject: "Mathematics",
    type: "full",
    price: 999,
    regularPrice: 1499,
    outline: "Chapter 1: Algebra\nChapter 2: Geometry\nChapter 3: Trigonometry",
    courseDurationDays: 180,
  }, teacherToken);
  log("POST /api/courses (teacher creates)", r);
  if (r.ok && r.data?.course?._id) courseId = r.data.course._id;
  else if (r.ok && r.data?._id) courseId = r.data._id;

  // POST /api/courses — Student tries (should 403)
  r = await api("POST", "/api/courses", {
    title: "Test Course - Unauthorized",
    description: "Should not be created",
    category: "academic",
    classLevel: "9-10",
    subject: "Physics",
    type: "full",
    price: 0,
    outline: "Should fail",
  }, studentToken);
  log("POST /api/courses (student → 403)", r);

  // GET /api/courses — List courses
  r = await api("GET", "/api/courses", null);
  log("GET /api/courses (list all)", r);

  // GET /api/courses/:courseId — Get by ID
  if (courseId) {
    r = await api("GET", `/api/courses/${courseId}`, null);
    log("GET /api/courses/:id (by ID)", r);
  }

  // PUT /api/courses/:courseId — Update course
  if (courseId) {
    r = await api("PUT", `/api/courses/${courseId}`, {
      title: "Test Course - Mathematics (Updated)",
      price: 799,
    }, teacherToken);
    log("PUT /api/courses/:id (teacher updates)", r);
  }

  // ====================================================================
  // 📚 LECTURES — /api/courses/:courseId/lectures
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 LECTURES MODULE");
  console.log("=".repeat(60));

  if (courseId) {
    // POST lecture
    r = await api("POST", `/api/courses/${courseId}/lectures`, {
      title: "Test Lecture - Algebra Basics",
      description: "Introduction to algebraic expressions and equations",
      videoUrl: "https://example.com/algebra.mp4",
      isFree: true,
    }, teacherToken);
    log("POST /api/courses/:id/lectures (create)", r);
    if (r.ok && r.data?.lecture?._id) lectureId = r.data.lecture._id;
    else if (r.ok && r.data?._id) lectureId = r.data._id;

    // GET lectures
    r = await api("GET", `/api/courses/${courseId}/lectures`, null);
    log("GET /api/courses/:id/lectures (list)", r);
  }

  // ====================================================================
  // 📚 LIVE CLASSES — /api/courses/:courseId/live
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 LIVE CLASSES MODULE");
  console.log("=".repeat(60));

  if (courseId) {
    // POST live class
    r = await api("POST", `/api/courses/${courseId}/live`, {
      title: "Test Live - Algebra Review",
      dateTime: new Date(Date.now() + 86400000).toISOString(),
      meetLink: "https://meet.google.com/test-abc-def",
    }, teacherToken);
    log("POST /api/courses/:id/live (create)", r);
    if (r.ok && r.data?.liveClass?._id) liveClassId = r.data.liveClass._id;
    else if (r.ok && r.data?._id) liveClassId = r.data._id;

    // GET live classes
    r = await api("GET", `/api/courses/${courseId}/live`, null);
    log("GET /api/courses/:id/live (list)", r);
  }

  // ====================================================================
  // 📚 ENROLLMENT — /api/enroll & /api/enrollments
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 ENROLLMENT MODULE");
  console.log("=".repeat(60));

  if (courseId) {
    // POST /api/enroll — Student enrolls
    r = await api("POST", "/api/enroll", {
      courseId: courseId,
      paidAmount: 799,
      discountApplied: 0,
    }, studentToken);
    log("POST /api/enroll (student enrolls)", r);

    // POST duplicate enrollment
    r = await api("POST", "/api/enroll", {
      courseId: courseId,
      paidAmount: 799,
      discountApplied: 0,
    }, studentToken);
    log("POST /api/enroll (duplicate → should fail)", r);
  }

  // GET /api/enrollments
  r = await api("GET", "/api/enrollments", null, studentToken);
  log("GET /api/enrollments (student's enrollments)", r);

  // GET /api/enrollments/:courseId/access
  if (courseId) {
    r = await api("GET", `/api/enrollments/${courseId}/access`, null, studentToken);
    log("GET /api/enrollments/:id/access", r);
  }

  // ====================================================================
  // 📚 Q&A — /api/courses/:courseId/qna & /api/qna
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 Q&A MODULE");
  console.log("=".repeat(60));

  if (courseId) {
    // Student asks question
    r = await api("POST", `/api/courses/${courseId}/qna`, {
      question: "ভাই, বীজগণিতের দ্বিঘাত সমীকরণ আরও বিস্তারিত বুঝিয়ে বলবেন?",
    }, studentToken);
    log("POST /api/courses/:id/qna (ask question)", r);
    if (r.ok && r.data?.qna?._id) qnaId = r.data.qna._id;
    else if (r.ok && r.data?._id) qnaId = r.data._id;

    // List Q&A
    r = await api("GET", `/api/courses/${courseId}/qna`, null, studentToken);
    log("GET /api/courses/:id/qna (list)", r);
  }

  // Teacher answers
  if (qnaId) {
    r = await api("POST", `/api/qna/${qnaId}/answer`, {
      reply: "দ্বিঘাত সমীকরণ হলো ax² + bx + c = 0 আকারের একটি সমীকরণ...",
    }, teacherToken);
    log("POST /api/qna/:id/answer (teacher answers)", r);
  }

  // ====================================================================
  // 📚 LIVE — /api/live
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 LIVE MODULE — /api/live");
  console.log("=".repeat(60));

  if (liveClassId && lectureId) {
    // Teacher attaches recording
    r = await api("PUT", `/api/live/${liveClassId}/record`, {
      recordedLecture: lectureId,
    }, teacherToken);
    log("PUT /api/live/:id/record (teacher attaches)", r);

    // Student tries (should 403)
    r = await api("PUT", `/api/live/${liveClassId}/record`, {
      recordedLecture: lectureId,
    }, studentToken);
    log("PUT /api/live/:id/record (student → 403)", r);
  }

  // ====================================================================
  // 📚 DELETE COURSE
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 DELETE TESTS");
  console.log("=".repeat(60));

  if (courseId) {
    // Student tries to delete (should 403)
    r = await api("DELETE", `/api/courses/${courseId}`, null, studentToken);
    log("DELETE /api/courses/:id (student → 403)", r);

    // Teacher deletes
    r = await api("DELETE", `/api/courses/${courseId}`, null, teacherToken);
    log("DELETE /api/courses/:id (teacher deletes)", r);

    // Verify deleted
    r = await api("GET", `/api/courses/${courseId}`, null);
    log("GET /api/courses/:id (should be 404 after delete)", r);
  }

  // ====================================================================
  // 📚 AUTH MIDDLEWARE — Unauthorized
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 UNAUTHORIZED ACCESS TESTS");
  console.log("=".repeat(60));

  r = await api("GET", "/api/enrollments", null);
  log("GET /api/enrollments (no token → 401)", r);

  r = await api("POST", "/api/courses", {
    title: "Test", description: "Test", category: "academic",
    classLevel: "9-10", subject: "Test", type: "full",
    price: 0, outline: "Test",
  });
  log("POST /api/courses (no token → 401)", r);

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log("\n✅ All API route tests completed!");
  console.log(`   Routes tested:`);
  console.log(`   • Auth: register, login, forgot-password, change-password`);
  console.log(`   • Course: create, list, get, update, delete + role checks`);
  console.log(`   • Lecture: create, list`);
  console.log(`   • Live Class: create, list`);
  console.log(`   • Enrollment: enroll, list, access check + duplicate check`);
  console.log(`   • Q&A: ask question, list, answer`);
  console.log(`   • Live: attach recording`);
  console.log(`   • Auth middleware: 401/403 blocking`);

  // Cleanup
  console.log("\n🧹 Cleaning up test data...");
  await UserModel.deleteMany({ email: /^test-/ });
  await CourseModel.deleteMany({ title: /^Test/ });
  await LectureModel.deleteMany({ title: /^Test/ });
  await EnrollmentModel.deleteMany({});
  await QnAModel.deleteMany({});
  await LiveClassModel.deleteMany({});
  console.log("✅ Cleanup complete");

  await mongoose.disconnect();
  console.log("\n👋 Disconnected from MongoDB. Test suite finished!");
}

runTests().catch((err) => {
  console.error("💥 Test suite failed:", err);
  process.exit(1);
});
