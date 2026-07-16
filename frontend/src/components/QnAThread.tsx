"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/src/lib/api";

interface AnswerData {
  reply: string;
  images?: string[];
  teacher?: { name: string };
  date: string;
}

interface QnAItem {
  _id: string;
  question: string;
  images?: string[];
  student?: { name: string };
  answers?: AnswerData[];
  createdAt: string;
}

interface Props {
  courseId: string;
  disabled?: boolean;
}

/** Upload a single image file to the QnA upload endpoint and return its URL */
async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/api/qna/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}

export default function QnAThread({ courseId, disabled }: Props) {
  const [questions, setQuestions] = useState<QnAItem[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Images for new question
  const [questionImages, setQuestionImages] = useState<File[]>([]);
  const [questionPreviews, setQuestionPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchQna = async () => {
      try {
        const res = await api.get(`/api/courses/${courseId}/qna`);
        setQuestions(res.data.qna);
      } catch {
        // not accessible
      } finally {
        setFetching(false);
      }
    };
    fetchQna();
  }, [courseId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > 5 * 1024 * 1024) return false;
      return true;
    });
    setQuestionImages((prev) => [...prev, ...validFiles]);
    setQuestionPreviews((prev) => [
      ...prev,
      ...validFiles.map((f) => URL.createObjectURL(f)),
    ]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setQuestionImages((prev) => prev.filter((_, i) => i !== index));
    setQuestionPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setLoading(true);
    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (questionImages.length > 0) {
        imageUrls = await Promise.all(questionImages.map((f) => uploadImage(f)));
      }

      const res = await api.post(`/api/courses/${courseId}/qna`, {
        question: newQuestion,
        images: imageUrls,
      });
      setQuestions((prev) => [res.data.qna, ...prev]);
      setNewQuestion("");
      setQuestionImages([]);
      setQuestionPreviews([]);
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
        <form onSubmit={handleAsk} className="space-y-3">
          <div className="flex gap-2">
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
          </div>

          {/* Image Previews */}
          {questionPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {questionPreviews.map((preview, i) => (
                <div key={i} className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Image Upload Button */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              id={`qna-upload-${courseId}`}
            />
            <label
              htmlFor={`qna-upload-${courseId}`}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              ছবি যোগ করুন
            </label>
          </div>
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100 break-words">
                    {q.question}
                  </p>

                  {/* Question Images */}
                  {q.images && q.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {q.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                          <img
                            src={img}
                            alt="Question image"
                            className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 hover:opacity-80 transition"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-zinc-400 mt-1">
                    {q.student?.name} —{" "}
                    {new Date(q.createdAt).toLocaleDateString("bn-BD")}
                  </p>

                  {/* Answers */}
                  {q.answers && q.answers.length > 0 && (
                    <div className="mt-3 space-y-2 pl-4 border-l-2 border-zinc-300 dark:border-blue-800">
                      {q.answers.map((a, i) => (
                        <div key={i} className="text-sm">
                          <p className="text-zinc-600 dark:text-zinc-400 break-words">
                            {a.reply}
                          </p>

                          {/* Answer Images */}
                          {a.images && a.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {a.images.map((img, j) => (
                                <a key={j} href={img} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={img}
                                    alt="Answer image"
                                    className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 hover:opacity-80 transition"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

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
