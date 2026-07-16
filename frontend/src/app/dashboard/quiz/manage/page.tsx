"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import DeleteConfirmDialog from "@/src/components/DeleteConfirmDialog";

interface QuizQuestion {
  _id: string;
  chapter: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  source: "ai" | "manual";
}

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

const emptyQuestionForm = {
  chapter: "",
  question: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  explanation: "",
};

function QuizManageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const { user, token } = useAuthStore();
  const { addToast } = useToast();

  const [courseTitle, setCourseTitle] = useState("");
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [rules, setRules] = useState<Rules | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [newChapterName, setNewChapterName] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [genCount, setGenCount] = useState("");
  const [genInstructions, setGenInstructions] = useState("");
  const [generating, setGenerating] = useState(false);

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyQuestionForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!token || user?.role === "student") {
      router.push("/dashboard");
      return;
    }
    if (courseId) fetchInitial();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, router, courseId]);

  const fetchInitial = async () => {
    try {
      const [courseRes, chaptersRes] = await Promise.all([
        api.get(`/api/courses/${courseId}`),
        api.get(`/api/quiz/${courseId}/chapters`),
      ]);
      setCourseTitle(courseRes.data.course?.title || "");
      const ch: ChapterInfo[] = chaptersRes.data.chapters || [];
      setChapters(ch);
      setRules(chaptersRes.data.rules || null);
      if (ch.length > 0) setSelectedChapter(ch[0].chapter);
    } catch {
      addToast("কোর্স তথ্য লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    const res = await api.get(`/api/quiz/${courseId}/chapters`);
    setChapters(res.data.chapters || []);
    setRules(res.data.rules || null);
  };

  const fetchQuestions = async (chapter: string) => {
    if (!chapter) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    try {
      const res = await api.get(`/api/quiz/${courseId}/questions`, { params: { chapter } });
      setQuestions(res.data.questions || []);
    } catch {
      addToast("প্রশ্ন লোড করা যায়নি", "error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (selectedChapter) fetchQuestions(selectedChapter);
    else setQuestions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter]);

  const activeChapterForForms = selectedChapter || newChapterName.trim();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const chapter = (selectedChapter || newChapterName).trim();
    if (!chapter) {
      addToast("চ্যাপ্টার/টপিক নাম দিন", "error");
      return;
    }
    setGenerating(true);
    try {
      await api.post(`/api/quiz/${courseId}/generate`, {
        chapter,
        count: genCount ? Number(genCount) : undefined,
        instructions: genInstructions || undefined,
      });
      addToast("AI দিয়ে MCQ তৈরি হয়েছে", "success");
      setShowGenerateForm(false);
      setGenCount("");
      setGenInstructions("");
      setNewChapterName("");
      setSelectedChapter(chapter);
      await fetchChapters();
      await fetchQuestions(chapter);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "AI দিয়ে প্রশ্ন তৈরি ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setGenerating(false);
    }
  };

  const resetQuestionForm = () => {
    setFormData({ ...emptyQuestionForm, chapter: activeChapterForForms });
    setEditingId(null);
    setShowQuestionForm(false);
  };

  const handleEditQuestion = (q: QuizQuestion) => {
    setFormData({
      chapter: q.chapter,
      question: q.question,
      options: q.options.length >= 2 ? q.options : ["", "", "", ""],
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || "",
    });
    setEditingId(q._id);
    setShowQuestionForm(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    const chapter = formData.chapter.trim();
    const options = formData.options.map((o) => o.trim()).filter(Boolean);
    if (!chapter || !formData.question.trim() || options.length < 2) {
      addToast("চ্যাপ্টার, প্রশ্ন ও কমপক্ষে ২টি অপশন আবশ্যক", "error");
      return;
    }
    if (formData.correctOptionIndex >= options.length) {
      addToast("সঠিক অপশন নির্বাচন করুন", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        chapter,
        question: formData.question.trim(),
        options,
        correctOptionIndex: formData.correctOptionIndex,
        explanation: formData.explanation.trim() || undefined,
      };
      if (editingId) {
        await api.put(`/api/quiz/${courseId}/questions/${editingId}`, payload);
        addToast("প্রশ্ন আপডেট করা হয়েছে", "success");
      } else {
        await api.post(`/api/quiz/${courseId}/questions`, payload);
        addToast("প্রশ্ন যোগ করা হয়েছে", "success");
      }
      resetQuestionForm();
      setSelectedChapter(chapter);
      await fetchChapters();
      await fetchQuestions(chapter);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteTarget || !courseId) return;
    try {
      await api.delete(`/api/quiz/${courseId}/questions/${deleteTarget}`);
      addToast("প্রশ্ন মুছে ফেলা হয়েছে", "success");
      setDeleteTarget(null);
      await fetchChapters();
      await fetchQuestions(selectedChapter);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "মুছে ফেলা ব্যর্থ";
      addToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  if (!courseId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          MCQ টেস্ট ম্যানেজমেন্ট
        </h1>
        <p className="text-zinc-500 mb-4">একটি কোর্স সিলেক্ট করুন</p>
        <Link href="/dashboard/courses/manage" className="text-zinc-800 dark:text-zinc-500 hover:underline">
          কোর্স ম্যানেজমেন্টে যান
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard/courses/manage"
          className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
        >
          &larr; কোর্স ম্যানেজমেন্টে ফিরুন
        </Link>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">MCQ টেস্ট ম্যানেজমেন্ট</h1>
        <p className="text-zinc-500 text-sm mt-1">{courseTitle}</p>
        {rules && (
          <p className="text-xs text-zinc-500 mt-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg inline-block">
            নিয়ম: প্রতি প্রশ্ন ১ মার্ক · {rules.category === "job" ? `ভুল উত্তরে -${rules.negativeMarkPerWrong} মার্ক কাটা যাবে` : "নেগেটিভ মার্কিং নেই"} · প্রতি প্রশ্নে {rules.timePerQuestionSec} সেকেন্ড সময়
          </p>
        )}
      </div>

      {/* Chapter picker */}
      <div className="mb-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          চ্যাপ্টার/টপিক নির্বাচন করুন
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {chapters.map((c) => (
            <button
              key={c.chapter}
              onClick={() => {
                setSelectedChapter(c.chapter);
                setNewChapterName("");
              }}
              className={`px-3 py-1.5 text-xs rounded-full border transition ${
                selectedChapter === c.chapter
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {c.chapter} ({c.questionCount})
            </button>
          ))}
          {chapters.length === 0 && (
            <p className="text-xs text-zinc-500">এখনো কোনো চ্যাপ্টারে MCQ যোগ করা হয়নি</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newChapterName}
            onChange={(e) => {
              setNewChapterName(e.target.value);
              setSelectedChapter("");
            }}
            placeholder="নতুন চ্যাপ্টার/টপিকের নাম লিখুন"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowGenerateForm((v) => !v)}
          disabled={!activeChapterForForms}
          className="px-4 py-2 bg-[#D97757] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm transition"
        >
          ✨ AI দিয়ে MCQ তৈরি করুন
        </button>
        <button
          onClick={() => {
            resetQuestionForm();
            setFormData((prev) => ({ ...prev, chapter: activeChapterForForms }));
            setShowQuestionForm(true);
          }}
          disabled={!activeChapterForForms}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg text-sm transition"
        >
          + ম্যানুয়াল প্রশ্ন যোগ করুন
        </button>
      </div>

      {/* AI generate form */}
      {showGenerateForm && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-1 text-zinc-800 dark:text-zinc-100">AI দিয়ে MCQ তৈরি করুন</h2>
          <p className="text-xs text-zinc-500 mb-4">চ্যাপ্টার: {activeChapterForForms || "—"}</p>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                কতগুলো MCQ (খালি রাখলে AI নিজে ঠিক করবে)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={genCount}
                onChange={(e) => setGenCount(e.target.value)}
                placeholder="যেমন: ১০"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                অতিরিক্ত নির্দেশনা (ঐচ্ছিক)
              </label>
              <textarea
                value={genInstructions}
                onChange={(e) => setGenInstructions(e.target.value)}
                rows={2}
                placeholder="যেমন: শুধু সূত্রভিত্তিক প্রশ্ন দাও"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={generating}
                className="px-6 py-2.5 bg-[#D97757] hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-medium transition"
              >
                {generating ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual question form */}
      {showQuestionForm && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
            {editingId ? "প্রশ্ন এডিট করুন" : "নতুন প্রশ্ন"}
          </h2>
          <form onSubmit={handleQuestionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                চ্যাপ্টার/টপিক *
              </label>
              <input
                type="text"
                value={formData.chapter}
                onChange={(e) => setFormData((prev) => ({ ...prev, chapter: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">প্রশ্ন *</label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                required
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                অপশনসমূহ * (সঠিক উত্তরের পাশে রেডিও বাটন সিলেক্ট করুন)
              </label>
              <div className="space-y-2">
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={formData.correctOptionIndex === idx}
                      onChange={() => setFormData((prev) => ({ ...prev, correctOptionIndex: idx }))}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) =>
                        setFormData((prev) => {
                          const options = [...prev.options];
                          options[idx] = e.target.value;
                          return { ...prev, options };
                        })
                      }
                      placeholder={`অপশন ${idx + 1}`}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== idx),
                            correctOptionIndex:
                              prev.correctOptionIndex >= idx && prev.correctOptionIndex > 0
                                ? prev.correctOptionIndex - 1
                                : prev.correctOptionIndex,
                          }))
                        }
                        className="text-red-500 text-xs px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formData.options.length < 6 && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, options: [...prev.options, ""] }))
                  }
                  className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
                >
                  + আরেকটি অপশন
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                ব্যাখ্যা (ঐচ্ছিক)
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData((prev) => ({ ...prev, explanation: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
              >
                {saving ? "সেভ হচ্ছে..." : editingId ? "আপডেট" : "যোগ করুন"}
              </button>
              <button
                type="button"
                onClick={resetQuestionForm}
                className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Question list */}
      {loadingQuestions ? (
        <p className="text-zinc-500 text-sm">প্রশ্ন লোড হচ্ছে...</p>
      ) : (
        <div className="space-y-3">
          {selectedChapter && questions.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-500">এই চ্যাপ্টারে কোনো প্রশ্ন নেই</p>
            </div>
          )}
          {questions.map((q, idx) => (
            <div
              key={q._id}
              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {idx + 1}. {q.question}{" "}
                    {q.source === "ai" && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                        AI
                      </span>
                    )}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {q.options.map((opt, oidx) => (
                      <li
                        key={oidx}
                        className={`text-xs px-2 py-1 rounded ${
                          oidx === q.correctOptionIndex
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {oidx === q.correctOptionIndex ? "✓ " : ""}
                        {opt}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <p className="mt-2 text-xs text-zinc-500 italic">ব্যাখ্যা: {q.explanation}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditQuestion(q)}
                    className="px-3 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                  >
                    এডিট
                  </button>
                  <button
                    onClick={() => setDeleteTarget(q._id)}
                    className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                  >
                    ডিলিট
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title="প্রশ্ন মুছে ফেলুন"
        message="আপনি কি নিশ্চিত? এই MCQ প্রশ্নটি স্থায়ীভাবে মুছে যাবে।"
        onConfirm={handleDeleteQuestion}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function QuizManagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-500">লোড হচ্ছে...</p>
        </div>
      }
    >
      <QuizManageContent />
    </Suspense>
  );
}
