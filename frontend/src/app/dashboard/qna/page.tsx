"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import QnAThread from "@/src/components/QnAThread";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";

interface QnAItem {
  _id: string;
  course: { _id: string; title: string };
  student: { _id: string; name: string; email: string };
  question: string;
  images?: string[];
  answers: { _id?: string; reply: string; images?: string[]; teacher?: { name: string }; date: string }[];
  createdAt: string;
}

interface Enrollment {
  _id: string;
  course: { _id: string; title: string };
  expiryAt: string;
}

export default function QnAPage() {
  const { user } = useAuthStore();

  if (user?.role === "student") return <StudentQnAView />;
  return <TeacherAdminQnAView />;
}

// ============ Student View ============
function StudentQnAView() {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push(loginUrlWithRedirect(pathname));
      return;
    }
    (async () => {
      try {
        const res = await api.get("/api/enrollments");
        setEnrollments(res.data.enrollments || []);
      } catch {
        addToast("কোর্স তথ্য লোড করা যায়নি", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  const now = new Date();
  const sorted = [...enrollments].sort(
    (a, b) => new Date(b.expiryAt).getTime() - new Date(a.expiryAt).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          💬 আমার প্রশ্ন-উত্তর
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          এনরোল করা কোর্স অনুযায়ী প্রশ্ন করুন এবং শিক্ষকের উত্তর দেখুন
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500 mb-4">আপনি এখনো কোনো কোর্সে এনরোল্ড হননি</p>
          <Link
            href="/courses"
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition font-medium inline-block"
          >
            কোর্স দেখুন
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sorted.map((enr) => {
            const expired = new Date(enr.expiryAt) < now;
            return (
              <div
                key={enr._id}
                className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {enr.course?.title}
                  </h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      expired
                        ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                        : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                    }`}
                  >
                    {expired ? "মেয়াদ উত্তীর্ণ" : "সক্রিয়"}
                  </span>
                </div>
                <QnAThread courseId={enr.course._id} disabled={expired} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ Teacher / Admin View ============
function TeacherAdminQnAView() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [qnas, setQnas] = useState<QnAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<Record<string, boolean>>({});

  // Images per reply
  const [replyImages, setReplyImages] = useState<Record<string, File[]>>({});
  const [replyPreviews, setReplyPreviews] = useState<Record<string, string[]>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/api/qna/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  }

  useEffect(() => {
    if (
      !token ||
      (user?.role !== "teacher" && user?.role !== "admin" && user?.role !== "superAdmin")
    ) {
      addToast("অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchQnas();
  }, [token, user, router]);

  const fetchQnas = async () => {
    try {
      // Fetch all courses first
      const coursesRes = await api.get("/api/courses");
      const courses = coursesRes.data.courses || [];

      // Then fetch Q&A for each course
      const allQnas: QnAItem[] = [];
      for (const course of courses) {
        try {
          const qnaRes = await api.get(`/api/courses/${course._id}/qna`);
          const items = qnaRes.data.qna || [];
          allQnas.push(...items.map((item: any) => ({ ...item, course })));
        } catch {
          // Skip if no access
        }
      }
      // Sort by newest first
      allQnas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setQnas(allQnas);
    } catch {
      addToast("Q&A তথ্য লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (qnaId: string) => {
    const reply = replyText[qnaId]?.trim();
    if (!reply) return;

    setReplying((prev) => ({ ...prev, [qnaId]: true }));
    try {
      // Upload images first
      let imageUrls: string[] = [];
      const imgs = replyImages[qnaId] || [];
      if (imgs.length > 0) {
        imageUrls = await Promise.all(imgs.map((f) => uploadImage(f)));
      }

      await api.post(`/api/qna/${qnaId}/answer`, { reply, images: imageUrls });
      addToast("উত্তর দেওয়া হয়েছে!", "success");
      setReplyText((prev) => ({ ...prev, [qnaId]: "" }));
      setReplyImages((prev) => ({ ...prev, [qnaId]: [] }));
      setReplyPreviews((prev) => ({ ...prev, [qnaId]: [] }));
      fetchQnas();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "উত্তর পাঠানো ব্যর্থ";
      addToast(msg, "error");
    } finally {
      setReplying((prev) => ({ ...prev, [qnaId]: false }));
    }
  };

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
          href="/dashboard"
          className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
        >
          &larr; ড্যাশবোর্ডে ফিরুন
        </Link>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          💬 প্রশ্ন ও উত্তর ব্যবস্থাপনা
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          শিক্ষার্থীদের প্রশ্নের উত্তর দিন
        </p>
      </div>

      {qnas.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো প্রশ্ন নেই</p>
        </div>
      ) : (
        <div className="space-y-4">
          {qnas.map((qna) => (
            <div
              key={qna._id}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              {/* Question */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900/40 flex items-center justify-center text-sm font-medium text-zinc-900 dark:text-zinc-400 flex-shrink-0">
                  {qna.student?.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
                      {qna.course?.title || "Unknown"}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(qna.createdAt).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-100 break-words">
                    {qna.question}
                  </p>
                  {/* Question Images */}
                  {qna.images && qna.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {qna.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                          <img
                            src={img}
                            alt="Q"
                            className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 hover:opacity-80 transition"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 mt-1">
                    — {qna.student?.name || "ছাত্র"}
                  </p>
                </div>
              </div>

              {/* Existing Answers */}
              {qna.answers && qna.answers.length > 0 && (
                <div className="ml-12 mb-4 space-y-3 pl-4 border-l-2 border-zinc-300 dark:border-blue-800">
                  {qna.answers.map((a, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-zinc-600 dark:text-zinc-400 break-words">{a.reply}</p>
                      {/* Answer Images */}
                      {a.images && a.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {a.images.map((img, j) => (
                            <a key={j} href={img} target="_blank" rel="noopener noreferrer">
                              <img
                                src={img}
                                alt="A"
                                className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 hover:opacity-80 transition"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-zinc-400 mt-1">
                        — {a.teacher?.name || "শিক্ষক"} ·{" "}
                        {new Date(a.date).toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <div className="ml-12 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText[qna._id] || ""}
                    onChange={(e) =>
                      setReplyText((prev) => ({ ...prev, [qna._id]: e.target.value }))
                    }
                    placeholder="উত্তর লিখুন..."
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => handleReply(qna._id)}
                    disabled={replying[qna._id] || !replyText[qna._id]?.trim()}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-500 text-white rounded-lg text-sm transition"
                  >
                    {replying[qna._id] ? "..." : "উত্তর"}
                  </button>
                </div>

                {/* Teacher Image Previews */}
                {(replyPreviews[qna._id] || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(replyPreviews[qna._id] || []).map((preview, i) => (
                      <div key={i} className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-14 h-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setReplyImages((prev) => ({
                              ...prev,
                              [qna._id]: (prev[qna._id] || []).filter((_, j) => j !== i),
                            }));
                            setReplyPreviews((prev) => ({
                              ...prev,
                              [qna._id]: (prev[qna._id] || []).filter((_, j) => j !== i),
                            }));
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Teacher Image Upload */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).filter(
                        (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
                      );
                      setReplyImages((prev) => ({
                        ...prev,
                        [qna._id]: [...(prev[qna._id] || []), ...files],
                      }));
                      setReplyPreviews((prev) => ({
                        ...prev,
                        [qna._id]: [
                          ...(prev[qna._id] || []),
                          ...files.map((f) => URL.createObjectURL(f)),
                        ],
                      }));
                      if (e.target) e.target.value = "";
                    }}
                    className="hidden"
                    id={`reply-upload-${qna._id}`}
                    ref={(el) => { fileInputRefs.current[qna._id] = el; }}
                  />
                  <label
                    htmlFor={`reply-upload-${qna._id}`}
                    className="cursor-pointer inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    ছবি
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
