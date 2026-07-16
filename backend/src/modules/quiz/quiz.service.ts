import { connectToDB } from "../../shared/lib/db";
import { CourseModel } from "../../shared/models/Course";
import { EnrollmentModel } from "../../shared/models/Enrollment";
import { QuizQuestionModel } from "../../shared/models/QuizQuestion";
import { QuizAttemptModel } from "../../shared/models/QuizAttempt";

// ---------- Category-based marking/timing rules ----------
// academic: no negative marking, 1 minute per MCQ
// job (job/admission prep courses): -0.25 per wrong MCQ, 43 seconds per MCQ
const CATEGORY_RULES: Record<"academic" | "job", { negativeMarkPerWrong: number; timePerQuestionSec: number }> = {
  academic: { negativeMarkPerWrong: 0, timePerQuestionSec: 60 },
  job: { negativeMarkPerWrong: 0.25, timePerQuestionSec: 43 },
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function getCourseOrThrow(courseId: string) {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw { status: 404, message: "কোর্স পাওয়া যায়নি" };
  }
  return course;
}

function assertCanManage(course: { teacher: { toString(): string } }, userId: string, role: string) {
  if (role !== "admin" && role !== "superAdmin" && course.teacher.toString() !== userId) {
    throw { status: 403, message: "শুধুমাত্র শিক্ষক/অ্যাডমিন MCQ পরিচালনা করতে পারেন" };
  }
}

// ============ AI Generation ============

interface AIQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

async function generateQuestionsWithAI(params: {
  subject: string;
  classLevel: string;
  category: "academic" | "job";
  chapter: string;
  count?: number;
  instructions?: string;
}): Promise<AIQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw { status: 503, message: "AI প্রশ্ন জেনারেটর এখনো কনফিগার করা হয়নি" };
  }

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  const countInstruction = params.count
    ? `ঠিক ${params.count}টি MCQ তৈরি করো।`
    : "এই টপিকটি ভালোভাবে কভার করতে যতগুলো MCQ দরকার (সাধারণত ৮-১৫টি) ঠিক ততগুলোই তৈরি করো — প্রয়োজনের অতিরিক্ত না।";

  const styleInstruction =
    params.category === "job"
      ? "প্রশ্নের মান হবে বাংলাদেশের BCS/NTRCA/চাকরির প্রস্তুতিমূলক পরীক্ষার সমমানের — যুক্তিনির্ভর ও নির্ভুল।"
      : "প্রশ্নের মান হবে বাংলাদেশের স্কুল/কলেজ পাঠ্যক্রম অনুযায়ী স্পষ্ট ও ধারণাভিত্তিক।";

  const prompt = `তুমি একজন অভিজ্ঞ প্রশ্নপ্রণেতা। নিচের কোর্স/টপিকের উপর ভিত্তি করে বাংলা ভাষায় মাল্টিপল চয়েস প্রশ্ন (MCQ) তৈরি করো।

বিষয়: ${params.subject}
শ্রেণি/স্তর: ${params.classLevel}
চ্যাপ্টার/টপিক: ${params.chapter}
${styleInstruction}
${countInstruction}
${params.instructions ? `অতিরিক্ত নির্দেশনা: ${params.instructions}` : ""}

নিয়ম:
- প্রতিটি প্রশ্নে ঠিক ৪টি অপশন থাকবে, এর মধ্যে ঠিক একটি সঠিক উত্তর।
- correctOptionIndex হবে সঠিক অপশনের ইনডেক্স (0 থেকে 3)।
- প্রতিটি প্রশ্নের সাথে সংক্ষিপ্ত ব্যাখ্যা (explanation) দাও যা বুঝিয়ে দেবে কেন উত্তরটি সঠিক।
- প্রশ্নগুলো যেন একে অপরের পুনরাবৃত্তি না হয় এবং সরাসরি এই চ্যাপ্টার/টপিক সম্পর্কিত হয়।
- শুধুমাত্র নির্ধারিত JSON ফরম্যাটে উত্তর দাও, অন্য কোনো টেক্সট লিখো না।`;

  const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        question: { type: "STRING" },
        options: { type: "ARRAY", items: { type: "STRING" }, minItems: 4, maxItems: 4 },
        correctOptionIndex: { type: "INTEGER" },
        explanation: { type: "STRING" },
      },
      required: ["question", "options", "correctOptionIndex", "explanation"],
    },
  };

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      }
    );
  } catch (error) {
    console.error("Gemini quiz-generation request failed:", error);
    throw { status: 502, message: "AI-এর সাথে সংযোগ করা যায়নি" };
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Gemini quiz-generation error:", res.status, errBody);
    throw { status: 502, message: "AI থেকে প্রশ্ন তৈরি করা যায়নি" };
  }

  const data: any = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw { status: 502, message: "AI কোনো প্রশ্ন ফেরত দেয়নি" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw { status: 502, message: "AI-এর উত্তর পার্স করা যায়নি" };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw { status: 502, message: "AI কোনো বৈধ প্রশ্ন তৈরি করতে পারেনি" };
  }

  const valid = (parsed as any[])
    .filter(
      (q) =>
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctOptionIndex === "number" &&
        q.correctOptionIndex >= 0 &&
        q.correctOptionIndex < q.options.length
    )
    .map((q) => ({
      question: String(q.question).trim(),
      options: q.options.map((o: unknown) => String(o).trim()),
      correctOptionIndex: q.correctOptionIndex,
      explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
    }));

  if (valid.length === 0) {
    throw { status: 502, message: "AI কোনো বৈধ প্রশ্ন তৈরি করতে পারেনি" };
  }

  return valid;
}

export async function generateAndSaveQuestions(
  courseId: string,
  userId: string,
  role: string,
  data: { chapter: string; count?: number; instructions?: string }
) {
  await connectToDB();

  const course = await getCourseOrThrow(courseId);
  assertCanManage(course, userId, role);

  const aiQuestions = await generateQuestionsWithAI({
    subject: course.subject,
    classLevel: course.classLevel,
    category: course.category as "academic" | "job",
    chapter: data.chapter,
    count: data.count,
    instructions: data.instructions,
  });

  const lastQuestion = await QuizQuestionModel.findOne({ course: courseId, chapter: data.chapter })
    .sort({ order: -1 })
    .select("order");
  let nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

  const docs = aiQuestions.map((q) => ({
    course: courseId,
    chapter: data.chapter,
    question: q.question,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    explanation: q.explanation,
    order: nextOrder++,
    source: "ai" as const,
    createdBy: userId,
  }));

  const created = await QuizQuestionModel.insertMany(docs);
  return { message: `${created.length}টি MCQ AI দিয়ে তৈরি করা হয়েছে`, questions: created };
}

// ============ Manual CRUD ============

export async function listChapters(courseId: string) {
  await connectToDB();

  const course = await getCourseOrThrow(courseId);

  const grouped = await QuizQuestionModel.aggregate([
    { $match: { course: course._id } },
    { $group: { _id: "$chapter", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const rules = CATEGORY_RULES[course.category as "academic" | "job"];

  return {
    chapters: grouped.map((g) => ({ chapter: g._id as string, questionCount: g.count as number })),
    rules: {
      category: course.category,
      marksPerQuestion: 1,
      negativeMarkPerWrong: rules.negativeMarkPerWrong,
      timePerQuestionSec: rules.timePerQuestionSec,
    },
  };
}

export async function listQuestions(
  courseId: string,
  chapter: string | undefined,
  userId: string,
  role: string
) {
  await connectToDB();

  const course = await getCourseOrThrow(courseId);
  assertCanManage(course, userId, role);

  const filter: Record<string, unknown> = { course: courseId };
  if (chapter) filter.chapter = chapter;

  const questions = await QuizQuestionModel.find(filter).sort({ chapter: 1, order: 1 }).lean();
  return { questions };
}

export async function createQuestion(
  courseId: string,
  data: {
    chapter: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
  },
  userId: string,
  role: string
) {
  await connectToDB();

  const course = await getCourseOrThrow(courseId);
  assertCanManage(course, userId, role);

  if (data.correctOptionIndex < 0 || data.correctOptionIndex >= data.options.length) {
    throw { status: 400, message: "সঠিক অপশনের ইনডেক্স সঠিক নয়" };
  }

  const lastQuestion = await QuizQuestionModel.findOne({ course: courseId, chapter: data.chapter })
    .sort({ order: -1 })
    .select("order");
  const nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

  const question = await QuizQuestionModel.create({
    course: courseId,
    chapter: data.chapter,
    question: data.question,
    options: data.options,
    correctOptionIndex: data.correctOptionIndex,
    explanation: data.explanation || "",
    order: nextOrder,
    source: "manual",
    createdBy: userId,
  });

  return { message: "MCQ যোগ করা হয়েছে", question };
}

export async function updateQuestion(
  courseId: string,
  questionId: string,
  data: Partial<{
    chapter: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }>,
  userId: string,
  role: string
) {
  await connectToDB();

  const course = await getCourseOrThrow(courseId);
  assertCanManage(course, userId, role);

  const existing = await QuizQuestionModel.findOne({ _id: questionId, course: courseId });
  if (!existing) {
    throw { status: 404, message: "প্রশ্ন পাওয়া যায়নি" };
  }

  const nextOptions = data.options ?? existing.options;
  const nextCorrectIndex = data.correctOptionIndex ?? existing.correctOptionIndex;
  if (nextCorrectIndex < 0 || nextCorrectIndex >= nextOptions.length) {
    throw { status: 400, message: "সঠিক অপশনের ইনডেক্স সঠিক নয়" };
  }

  const updated = await QuizQuestionModel.findByIdAndUpdate(questionId, data, {
    new: true,
    runValidators: true,
  });

  return { message: "MCQ আপডেট করা হয়েছে", question: updated };
}

export async function deleteQuestion(
  courseId: string,
  questionId: string,
  userId: string,
  role: string
) {
  await connectToDB();

  const course = await getCourseOrThrow(courseId);
  assertCanManage(course, userId, role);

  const deleted = await QuizQuestionModel.findOneAndDelete({ _id: questionId, course: courseId });
  if (!deleted) {
    throw { status: 404, message: "প্রশ্ন পাওয়া যায়নি" };
  }

  return { message: "MCQ মুছে ফেলা হয়েছে" };
}

// ============ Attempts ============

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toStudentView(attempt: any) {
  return {
    _id: attempt._id,
    course: attempt.course,
    chapter: attempt.chapter,
    category: attempt.category,
    negativeMarkPerWrong: attempt.negativeMarkPerWrong,
    timePerQuestionSec: attempt.timePerQuestionSec,
    totalTimeAllowedSec: attempt.totalTimeAllowedSec,
    totalQuestions: attempt.totalQuestions,
    totalMarks: attempt.totalMarks,
    status: attempt.status,
    startedAt: attempt.startedAt,
    questions: attempt.questions.map((q: any, idx: number) => ({
      index: idx,
      questionText: q.questionText,
      options: q.options,
    })),
  };
}

export async function startAttempt(courseId: string, chapter: string, userId: string, role: string) {
  await connectToDB();

  const course = await getCourseOrThrow(courseId);

  // superAdmin/teacher always have access; admin only via a real enrollment grant
  // — matches the access model used for lectures (see course.service.ts).
  const isPrivileged = role === "superAdmin" || role === "teacher";
  if (!isPrivileged) {
    const enrollment = await EnrollmentModel.findOne({
      student: userId,
      course: courseId,
      expiryAt: { $gt: new Date() },
    });
    if (!enrollment) {
      throw { status: 403, message: "শুধুমাত্র এনরোল্ড শিক্ষার্থী MCQ টেস্ট দিতে পারেন" };
    }
  }

  const bank = await QuizQuestionModel.find({ course: courseId, chapter }).sort({ order: 1 }).lean();
  if (bank.length === 0) {
    throw { status: 404, message: "এই চ্যাপ্টারে কোনো MCQ পাওয়া যায়নি" };
  }

  const rules = CATEGORY_RULES[course.category as "academic" | "job"];
  const questions = shuffle(bank).map((q) => ({
    question: q._id,
    questionText: q.question,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    explanation: q.explanation || "",
    selectedOptionIndex: null,
    isCorrect: null,
    marksAwarded: 0,
  }));

  const attempt = await QuizAttemptModel.create({
    course: courseId,
    chapter,
    student: userId,
    category: course.category,
    negativeMarkPerWrong: rules.negativeMarkPerWrong,
    timePerQuestionSec: rules.timePerQuestionSec,
    totalTimeAllowedSec: questions.length * rules.timePerQuestionSec,
    questions,
    totalQuestions: questions.length,
    totalMarks: questions.length,
    status: "in-progress",
    startedAt: new Date(),
  });

  return { attempt: toStudentView(attempt) };
}

export async function submitAttempt(
  attemptId: string,
  userId: string,
  answers: (number | null)[]
) {
  await connectToDB();

  const attempt = await QuizAttemptModel.findById(attemptId);
  if (!attempt) {
    throw { status: 404, message: "টেস্ট পাওয়া যায়নি" };
  }
  if (attempt.student.toString() !== userId) {
    throw { status: 403, message: "অনুমতি নেই" };
  }
  if (attempt.status === "submitted") {
    return { attempt };
  }

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let obtainedMarks = 0;

  attempt.questions.forEach((q: any, idx: number) => {
    const selected = answers[idx] ?? null;
    q.selectedOptionIndex = selected;

    if (selected === null || selected === undefined) {
      q.isCorrect = null;
      q.marksAwarded = 0;
      unansweredCount++;
      return;
    }

    const isCorrect = selected === q.correctOptionIndex;
    q.isCorrect = isCorrect;
    if (isCorrect) {
      q.marksAwarded = 1;
      correctCount++;
      obtainedMarks += 1;
    } else {
      q.marksAwarded = -attempt.negativeMarkPerWrong;
      wrongCount++;
      obtainedMarks -= attempt.negativeMarkPerWrong;
    }
  });

  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.unansweredCount = unansweredCount;
  attempt.obtainedMarks = round2(obtainedMarks);
  attempt.timeTakenSec = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);
  attempt.status = "submitted";
  attempt.submittedAt = new Date();

  await attempt.save();

  return { attempt };
}

export async function getAttempt(attemptId: string, userId: string, role: string) {
  await connectToDB();

  const attempt = await QuizAttemptModel.findById(attemptId).lean();
  if (!attempt) {
    throw { status: 404, message: "টেস্ট পাওয়া যায়নি" };
  }

  const isOwner = attempt.student.toString() === userId;
  const isPrivileged = role === "admin" || role === "superAdmin" || role === "teacher";
  if (!isOwner && !isPrivileged) {
    throw { status: 403, message: "অনুমতি নেই" };
  }

  if (attempt.status === "in-progress") {
    return { attempt: toStudentView(attempt) };
  }

  return { attempt };
}

export async function listAttempts(courseId: string, chapter: string | undefined, userId: string) {
  await connectToDB();

  const filter: Record<string, unknown> = { course: courseId, student: userId };
  if (chapter) filter.chapter = chapter;

  const attempts = await QuizAttemptModel.find(filter)
    .select("-questions")
    .sort({ createdAt: -1 })
    .lean();

  return { attempts };
}
