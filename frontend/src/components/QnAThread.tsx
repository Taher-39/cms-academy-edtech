"use client";

import { useEffect, useState } from "react";
import api from "@/src/lib/api";

interface QnAItem {
  _id: string;
  question: string;
  student?: { name: string };
  answers?: { reply: string; teacher?: { name: string }; date: string }[];
  createdAt: string;
}

interface Props {
  courseId: string;
  /** Set to true once we know the course has expired for this student — disables asking new questions. */
  disabled?: boolean;
}

export default function QnAThread({ courseId, disabled }: Props) {
  const [questions, setQuestions] = useState<QnAItem[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchQna = async () => {
      try {
        const res = await api.get(`/api/courses/${courseId}/qna`);
        setQuestions(res.data.qna);
      } catch {
        // not accessible (not enrolled / expired) — leave list empty
      } finally {
        setFetching(false);
      }
    };
    fetchQna();
  }, [courseId]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/courses/${courseId}/qna`, {
        question: newQuestion,
      });
      setQuestions((prev) => [res.data.qna, ...prev]);
      setNewQuestion("");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <p className="text-sm text-zinc-500">লোড হচ্ছে...</p>;
  }

  return (
    <div className="space-y-4">
      {!disabled && (
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="আপনার প্রশ্ন লিখুন..."
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !newQuestion.trim()}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-500 text-white rounded-lg transition"
          >
            {loading ? "..." : "পাঠান"}
          </button>
        </form>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-zinc-500">কোনো প্রশ্ন নেই</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q._id}
              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900/40 flex items-center justify-center text-sm font-medium text-zinc-900 dark:text-zinc-400 flex-shrink-0">
                  {q.student?.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">
                    {q.question}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {q.student?.name} —{" "}
                    {new Date(q.createdAt).toLocaleDateString("bn-BD")}
                  </p>

                  {q.answers && q.answers.length > 0 && (
                    <div className="mt-3 space-y-2 pl-4 border-l-2 border-zinc-300 dark:border-blue-800">
                      {q.answers.map((a, i) => (
                        <div key={i} className="text-sm">
                          <p className="text-zinc-600 dark:text-zinc-400">
                            {a.reply}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            — {a.teacher?.name || "শিক্ষক"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
