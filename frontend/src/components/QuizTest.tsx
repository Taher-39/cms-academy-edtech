"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/src/lib/api";
import { useToast } from "@/src/components/Toast";

interface ChapterInfo {
  chapter: string;
  questionCount: number;
}

interface Rules {
  category: "academic" | "job";
  marksPerQuestion: number;
  negativeMarkPerWrong: number;
  timePerQuestionSec: number;
}

interface AttemptQuestion {
  index: number;
  questionText: string;
  options: string[];
}

interface StartedAttempt {
  _id: string;
  chapter: string;
  totalQuestions: number;
  totalMarks: number;
  totalTimeAllowedSec: number;
  negativeMarkPerWrong: number;
  questions: AttemptQuestion[];
}

interface ResultQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  selectedOptionIndex: number | null;
  isCorrect: boolean | null;
  marksAwarded: number;
}

interface ResultAttempt {
  _id: string;
  chapter: string;
  totalQuestions: number;
  totalMarks: number;
  obtainedMarks: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeTakenSec: number;
  questions: ResultQuestion[];
}

interface AttemptSummary {
  _id: string;
  chapter: string;
  totalQuestions: number;
  totalMarks: number;
  obtainedMarks: number | null;
  correctCount: number;
  wrongCount: number;
  status: "in-progress" | "submitted";
  submittedAt?: string;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function QuizTest({ courseId }: { courseId: string }) {
  const { addToast } = useToast();
  const [view, setView] = useState<"picker" | "test" | "result">("picker");
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [rules, setRules] = useState<Rules | null>(null);
  const [history, setHistory] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<StartedAttempt | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [result, setResult] = useState<ResultAttempt | null>(null);

  useEffect(() => {
    fetchPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchPicker = async () => {
    setLoading(true);
    try {
      const [chRes, histRes] = await Promise.all([
        api.get(`/api/quiz/${courseId}/chapters`),
        api.get(`/api/quiz/${courseId}/attempts`),
      ]);
      setChapters(chRes.data.chapters || []);
      setRules(chRes.data.rules || null);
      setHistory(histRes.data.attempts || []);
    } catch {
      // not enrolled / no access — leave empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view !== "test" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, timeLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (view === "test" && timeLeft === 0 && attempt && !submittingRef.current) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleStart = async (chapter: string) => {
    setStarting(chapter);
    try {
      const res = await api.post(`/api/quiz/${courseId}/attempts`, { chapter });
      const a: StartedAttempt = res.data.attempt;
      setAttempt(a);
      setAnswers(new Array(a.questions.length).fill(null));
      setTimeLeft(a.totalTimeAllowedSec);
      setResult(null);
      setView("test");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "টেস্ট শুরু করা যায়নি";
      addToast(msg, "error");
    } finally {
      setStarting(null);
    }
  };

  const handleSelect = (qIndex: number, optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!attempt || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/quiz/${courseId}/attempts/${attempt._id}/submit`, {
        answers,
      });
      setResult(res.data.attempt);
      setView("result");
      fetchPicker();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "সাবমিট করা যায়নি";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const viewPastResult = async (attemptId: string) => {
    try {
      const res = await api.get(`/api/quiz/${courseId}/attempts/${attemptId}`);
      if (res.data.attempt.status !== "submitted") return;
      setResult(res.data.attempt);
      setView("result");
    } catch {
      addToast("ফলাফল লোড করা যায়নি", "error");
    }
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">লোড হচ্ছে...</p>;
  }

  // ---------- Result view ----------
  if (view === "result" && result) {
    const percent = result.totalMarks > 0 ? Math.round((result.obtainedMarks / result.totalMarks) * 100) : 0;
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">{result.chapter}</h3>
          <div className="flex flex-wrap gap-4 text-sm mt-3">
            <span className="text-zinc-500">
              মোট নম্বর: <b className="text-zinc-800 dark:text-zinc-100">{result.obtainedMarks} / {result.totalMarks}</b> ({percent}%)
            </span>
            <span className="text-green-600 dark:text-green-400">✅ সঠিক: {result.correctCount}</span>
            <span className="text-red-600 dark:text-red-400">❌ ভুল: {result.wrongCount}</span>
            <span className="text-zinc-500">➖ উত্তর দেয়নি: {result.unansweredCount}</span>
          </div>
        </div>

        <div className="space-y-3">
          {result.questions.map((q, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 mb-2">
                {idx + 1}. {q.questionText}
              </p>
              <div className="space-y-1">
                {q.options.map((opt, oidx) => {
                  const isCorrectOpt = oidx === q.correctOptionIndex;
                  const isSelectedOpt = oidx === q.selectedOptionIndex;
                  let cls = "text-zinc-600 dark:text-zinc-400";
                  if (isCorrectOpt) cls = "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium";
                  else if (isSelectedOpt && !isCorrectOpt) cls = "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300";
                  return (
                    <div key={oidx} className={`text-xs px-2 py-1.5 rounded ${cls}`}>
                      {isCorrectOpt ? "✓ " : isSelectedOpt ? "✗ " : ""}
                      {opt}
                      {isSelectedOpt && <span className="ml-1 text-[10px]">(আপনার উত্তর)</span>}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <p className="mt-2 text-xs text-zinc-500 italic">ব্যাখ্যা: {q.explanation}</p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                মার্ক: {q.marksAwarded > 0 ? "+" : ""}
                {q.marksAwarded}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setView("picker");
            setResult(null);
            fetchPicker();
          }}
          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm transition"
        >
          &larr; চ্যাপ্টার তালিকায় ফিরুন
        </button>
      </div>
    );
  }

  // ---------- Test-taking view ----------
  if (view === "test" && attempt) {
    const answeredCount = answers.filter((a) => a !== null).length;
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {attempt.chapter} · উত্তর দেওয়া হয়েছে {answeredCount}/{attempt.totalQuestions}
          </div>
          <div
            className={`text-sm font-bold px-3 py-1 rounded-full ${
              timeLeft <= 30 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        <div className="space-y-3">
          {attempt.questions.map((q) => (
            <div
              key={q.index}
              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 mb-2">
                {q.index + 1}. {q.questionText}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, oidx) => (
                  <label
                    key={oidx}
                    className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border cursor-pointer transition ${
                      answers[q.index] === oidx
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                        : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.index}`}
                      checked={answers[q.index] === oidx}
                      onChange={() => handleSelect(q.index, oidx)}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full px-5 py-3 bg-[#D97757] hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-medium transition"
        >
          {submitting ? "সাবমিট হচ্ছে..." : "টেস্ট সাবমিট করুন"}
        </button>
      </div>
    );
  }

  // ---------- Chapter picker view ----------
  return (
    <div className="space-y-6">
      {rules && (
        <p className="text-xs text-zinc-500 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg inline-block">
          নিয়ম: প্রতি প্রশ্ন ১ মার্ক ·{" "}
          {rules.category === "job"
            ? `ভুল উত্তরে -${rules.negativeMarkPerWrong} মার্ক কাটা যাবে`
            : "নেগেটিভ মার্কিং নেই"}{" "}
          · প্রতি প্রশ্নে {rules.timePerQuestionSec} সেকেন্ড সময়
        </p>
      )}

      {chapters.length === 0 ? (
        <p className="text-sm text-zinc-500">এই কোর্সে এখনো কোনো MCQ টেস্ট যোগ করা হয়নি</p>
      ) : (
        <div className="space-y-2">
          {chapters.map((c) => (
            <div
              key={c.chapter}
              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.chapter}</p>
                <p className="text-xs text-zinc-500">{c.questionCount}টি MCQ</p>
              </div>
              <button
                onClick={() => handleStart(c.chapter)}
                disabled={starting === c.chapter}
                className="px-4 py-2 text-sm bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg transition flex-shrink-0"
              >
                {starting === c.chapter ? "শুরু হচ্ছে..." : "টেস্ট শুরু করুন"}
              </button>
            </div>
          ))}
        </div>
      )}

      {history.filter((h) => h.status === "submitted").length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">সাম্প্রতিক ফলাফল</h4>
          <div className="space-y-2">
            {history
              .filter((h) => h.status === "submitted")
              .map((h) => (
                <button
                  key={h._id}
                  onClick={() => viewPastResult(h._id)}
                  className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{h.chapter}</span>
                  <span className="text-xs text-zinc-500">
                    {h.obtainedMarks} / {h.totalMarks} মার্ক · ✅ {h.correctCount} · ❌ {h.wrongCount}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
