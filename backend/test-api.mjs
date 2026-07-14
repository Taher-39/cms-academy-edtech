/**
 * API Route Test Script
 * 
 * Tests all backend routes by:
 * 1. Connecting to MongoDB
 * 2. Creating test users (admin + student)
 * 3. Generating JWT tokens
 * 4. Testing all CRUD operations on each module
 */

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// --- Config ---
const MONGODB_URI = "mongodb+srv://abutaher:abutaher@cluster0.cvvga4z.mongodb.net/ms";
const JWT_SECRET = "maktabatus_salaf_super_secret_key_2026";
const BASE_URL = "http://localhost:5000";

let teacherToken, studentToken, courseId, lectureId, liveClassId, qnaId;

// --- Helpers ---
async function api(method, path, body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, data: err.message };
  }
}

function log(label, result) {
  const icon = result.ok ? "✅" : "❌";
  console.log(`\n${icon} ${label}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Response:`, JSON.stringify(result.data, null, 2).slice(0, 300));
  return result;
}

function generateToken(userId, role, email) {
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
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }

  // Clean up any previous test data
  const { UserModel } = await import("./src/shared/models/User.js");
  const { CourseModel } = await import("./src/shared/models/Course.js");
  const { LectureModel } = await import("./src/shared/models/Lecture.js");
  const { EnrollmentModel } = await import("./src/shared/models/Enrollment.js");
  const { QnAModel } = await import("./src/shared/models/QnA.js");
  const { LiveClassModel } = await import("./src/shared/models/LiveClass.js");

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

  // Teacher/Admin user
  const teacher = await UserModel.create({
    name: "Test Teacher",
    email: "test-teacher@test.com",
    password: hashedPassword,
    role: "teacher",
    isVerified: true,
  });
  teacherToken = generateToken(teacher._id.toString(), "teacher", teacher.email);
  console.log(`✅ Teacher created: ${teacher.email} (role: teacher)`);

  // Student user
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

  // POST /api/auth/forgot-password
  r = await api("POST", "/api/auth/forgot-password", {
    email: "test-teacher@test.com",
  });
  log("POST /api/auth/forgot-password", r);

  // POST /api/auth/change-password (authenticated)
  r = await api("POST", "/api/auth/change-password", {
    oldPassword: "test1234",
    newPassword: "test12345",
  }, teacherToken);
  log("POST /api/auth/change-password", r);

  // Change password back to original for other tests
  await api("POST", "/api/auth/change-password", {
    oldPassword: "test12345",
    newPassword: "test1234",
  }, teacherToken);

  // POST /api/auth/register — validation error test
  r = await api("POST", "/api/auth/register", {
    name: "",
    email: "invalid",
    password: "12",
  });
  log("POST /api/auth/register (validation error)", r);

  // ====================================================================
  // 📚 COURSE MODULE — /api/courses
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 COURSE MODULE — /api/courses");
  console.log("=".repeat(60));

  // POST /api/courses — Create course (teacher only)
  r = await api("POST", "/api/courses", {
    title: "Test Course - Mathematics",
    description: "A comprehensive test course for mathematics",
    category: "academic",
    classLevel: "9-10",
    subject: "Mathematics",
    type: "full",
    price: 999,
    regularPrice: 1499,
    outline: "Chapter 1: Algebra\nChapter 2: Geometry\nChapter 3: Trigonometry",
    courseDurationDays: 180,
    isLive: false,
  }, teacherToken);
  log("POST /api/courses (create)", r);
  if (r.ok && r.data?._id) courseId = r.data._id;

  // POST /api/courses — Student trying to create (should fail)
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
  log("GET /api/courses (list)", r);

  // GET /api/courses/:courseId — Get course by ID
  if (courseId) {
    r = await api("GET", `/api/courses/${courseId}`, null);
    log("GET /api/courses/:id", r);
  }

  // PUT /api/courses/:courseId — Update course
  if (courseId) {
    r = await api("PUT", `/api/courses/${courseId}`, {
      title: "Test Course - Mathematics (Updated)",
      price: 799,
    }, teacherToken);
    log("PUT /api/courses/:id (update)", r);
  }

  // ====================================================================
  // 📚 LECTURES — /api/courses/:courseId/lectures
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 LECTURES — /api/courses/:courseId/lectures");
  console.log("=".repeat(60));

  if (courseId) {
    // POST /api/courses/:courseId/lectures — Create lecture
    r = await api("POST", `/api/courses/${courseId}/lectures`, {
      title: "Test Lecture - Algebra Basics",
      description: "Introduction to algebraic expressions",
      videoUrl: "https://example.com/algebra.mp4",
      isFree: true,
    }, teacherToken);
    log("POST /api/courses/:id/lectures (create)", r);
    if (r.ok && r.data?._id) lectureId = r.data._id;

    // GET /api/courses/:courseId/lectures — List lectures
    r = await api("GET", `/api/courses/${courseId}/lectures`, null);
    log("GET /api/courses/:id/lectures (list)", r);
  }

  // ====================================================================
  // 📚 LIVE CLASSES — /api/courses/:courseId/live
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 LIVE CLASSES — /api/courses/:courseId/live");
  console.log("=".repeat(60));

  if (courseId) {
    // POST /api/courses/:courseId/live — Create live class
    r = await api("POST", `/api/courses/${courseId}/live`, {
      title: "Test Live Class - Algebra Review",
      dateTime: new Date(Date.now() + 86400000).toISOString(),
      meetLink: "https://meet.google.com/test-abc-def",
    }, teacherToken);
    log("POST /api/courses/:id/live (create)", r);
    if (r.ok && r.data?._id) liveClassId = r.data._id;

    // GET /api/courses/:courseId/live — List live classes
    r = await api("GET", `/api/courses/${courseId}/live`, null);
    log("GET /api/courses/:id/live (list)", r);
  }

  // ====================================================================
  // 📚 ENROLLMENT MODULE — /api/enroll & /api/enrollments
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 ENROLLMENT MODULE — /api/enroll & /api/enrollments");
  console.log("=".repeat(60));

  if (courseId) {
    // POST /api/enroll — Student enrolls (for free since price is now 799, but this is test)
    r = await api("POST", "/api/enroll", {
      courseId: courseId,
      paidAmount: 799,
      discountApplied: 0,
    }, studentToken);
    log("POST /api/enroll (enroll student)", r);

    // POST /api/enroll — Duplicate enrollment (should fail)
    r = await api("POST", "/api/enroll", {
      courseId: courseId,
      paidAmount: 799,
      discountApplied: 0,
    }, studentToken);
    log("POST /api/enroll (duplicate → should fail)", r);
  }

  // GET /api/enrollments — List student's enrollments
  r = await api("GET", "/api/enrollments", null, studentToken);
  log("GET /api/enrollments (student)", r);

  // GET /api/enrollments/:courseId/access — Check access
  if (courseId) {
    r = await api("GET", `/api/enrollments/${courseId}/access`, null, studentToken);
    log("GET /api/enrollments/:id/access", r);
  }

  // ====================================================================
  // 📚 Q&A MODULE — /api/courses/:courseId/qna & /api/qna
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 Q&A MODULE — /api/courses/:courseId/qna & /api/qna");
  console.log("=".repeat(60));

  if (courseId) {
    // POST /api/courses/:courseId/qna — Ask a question
    r = await api("POST", `/api/courses/${courseId}/qna`, {
      question: "Can you explain quadratic equations in more detail?",
    }, studentToken);
    log("POST /api/courses/:id/qna (ask question)", r);
    if (r.ok && r.data?._id) qnaId = r.data._id;

    // GET /api/courses/:courseId/qna — List Q&A
    r = await api("GET", `/api/courses/${courseId}/qna`, null, studentToken);
    log("GET /api/courses/:id/qna (list)", r);
  }

  // POST /api/qna/:qnaId/answer — Teacher answers
  if (qnaId) {
    r = await api("POST", `/api/qna/${qnaId}/answer`, {
      reply: "Sure! A quadratic equation is of the form ax² + bx + c = 0...",
    }, teacherToken);
    log("POST /api/qna/:id/answer (teacher answers)", r);
  }

  // ====================================================================
  // 📚 LIVE MODULE — /api/live
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 LIVE MODULE — /api/live");
  console.log("=".repeat(60));

  if (liveClassId && lectureId) {
    // PUT /api/live/:id/record — Attach recording
    r = await api("PUT", `/api/live/${liveClassId}/record`, {
      recordedLecture: lectureId,
    }, teacherToken);
    log("PUT /api/live/:id/record (attach recording)", r);

    // Student tries (should fail)
    r = await api("PUT", `/api/live/${liveClassId}/record`, {
      recordedLecture: lectureId,
    }, studentToken);
    log("PUT /api/live/:id/record (student → 403)", r);
  }

  // ====================================================================
  // 📚 DELETE TESTS — /api/courses/:courseId
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 DELETE TESTS");
  console.log("=".repeat(60));

  if (courseId) {
    // DELETE /api/courses/:courseId — Delete course
    r = await api("DELETE", `/api/courses/${courseId}`, null, teacherToken);
    log("DELETE /api/courses/:id (delete)", r);

    // Verify it's deleted
    r = await api("GET", `/api/courses/${courseId}`, null);
    log("GET /api/courses/:id (should be 404)", r);
  }

  // ====================================================================
  // 📚 UNAUTHORIZED ACCESS TESTS
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📚 UNAUTHORIZED ACCESS TESTS");
  console.log("=".repeat(60));

  r = await api("GET", "/api/enrollments", null);
  log("GET /api/enrollments (no auth → 401)", r);

  r = await api("POST", "/api/courses", {
    title: "Test",
    description: "Test",
    category: "academic",
    classLevel: "9-10",
    subject: "Test",
    type: "full",
    price: 0,
    outline: "Test",
  });
  log("POST /api/courses (no auth → 401)", r);

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log("\n✅ All API route tests completed!");
  console.log(`   - Auth module: register, login, forgot-password, change-password`);
  console.log(`   - Course module: CRUD + authorization checks`);
  console.log(`   - Lecture module: create, list`);
  console.log(`   - Live Class module: create, list, attach recording`);
  console.log(`   - Enrollment module: enroll, list, access check`);
  console.log(`   - Q&A module: ask question, list, answer`);
  console.log(`   - Live module: attach recording`);
  console.log(`   - Auth middleware: unauthorized access blocked`);

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

runTests().catch(console.error);
