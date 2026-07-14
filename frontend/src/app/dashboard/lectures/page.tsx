"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import DeleteConfirmDialog from "@/src/components/DeleteConfirmDialog";

interface Lecture {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  noteUrl?: string;
  order: number;
  isFree: boolean;
}

function LectureManageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const { user, token } = useAuthStore();
  const { addToast } = useToast();

  const [courseTitle, setCourseTitle] = useState("");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    noteUrl: "",
    isFree: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!token || user?.role === "student") {
      router.push("/dashboard");
      return;
    }
    if (courseId) fetchData();
    else setLoading(false);
  }, [token, user, router, courseId]);

  const fetchData = async () => {
    try {
      const [courseRes, lectRes] = await Promise.all([
        api.get(`/api/courses/${courseId}`),
        api.get(`/api/courses/${courseId}/lectures`),
      ]);
      setCourseTitle(courseRes.data.course?.title || "");
      setLectures(lectRes.data.lectures || []);
    } catch {
      setError("কোর্স তথ্য লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", videoUrl: "", noteUrl: "", isFree: false });
    setEditingId(null);
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  const handleEdit = (lecture: Lecture) => {
    setFormData({
      title: lecture.title,
      description: lecture.description || "",
      videoUrl: lecture.videoUrl || "",
      noteUrl: lecture.noteUrl || "",
      isFree: lecture.isFree,
    });
    setEditingId(lecture._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await api.put(`/api/courses/${courseId}/lectures/${editingId}`, formData);
        addToast("লেকচার আপডেট করা হয়েছে!", "success");
        resetForm();
        fetchData();
      } else {
        await api.post(`/api/courses/${courseId}/lectures`, formData);
        setSuccess("লেকচার যোগ করা হয়েছে!");
        resetForm();
        fetchData();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ব্যর্থ হয়েছে";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLecture = async () => {
    if (!deleteTarget || !courseId) return;
    try {
      await api.delete(`/api/courses/${courseId}/lectures/${deleteTarget}`);
      addToast("লেকচার মুছে ফেলা হয়েছে!", "success");
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "মুছে ফেলা ব্যর্থ";
      addToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  if (!courseId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          লেকচার ম্যানেজমেন্ট
        </h1>
        <p className="text-zinc-500 mb-4">একটি কোর্স সিলেক্ট করুন</p>
        <Link
          href="/dashboard/courses/manage"
          className="text-zinc-800 dark:text-zinc-500 hover:underline"
        >
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
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          লেকচার ম্যানেজমেন্ট
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{courseTitle}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Add Lecture Button */}
      <button
        onClick={() => {
          resetForm();
          setShowForm(true);
        }}
        className="mb-6 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-sm transition"
      >
        + নতুন লেকচার
      </button>

      {/* Lecture Form */}
      {showForm && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
            {editingId ? "লেকচার এডিট করুন" : "নতুন লেকচার"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                লেকচার শিরোনাম *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                বিবরণ
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                YouTube ভিডিও লিংক (Unlisted)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                নোট লিংক (Google Drive)
              </label>
              <input
                type="url"
                value={formData.noteUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, noteUrl: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isFree: e.target.checked }))
                }
                className="rounded"
              />
              <label className="text-sm text-zinc-700 dark:text-zinc-300">
                ফ্রি প্রিভিউ (সবার জন্য উন্মুক্ত)
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
              >
                {saving ? "সেভ হচ্ছে..." : editingId ? "আপডেট" : "যোগ করুন"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lecture List */}
      <div className="space-y-2">
        {lectures.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <p className="text-zinc-500">কোনো লেকচার নেই</p>
          </div>
        ) : (
          lectures.map((lecture, index) => (
            <div
              key={lecture._id}
              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-bold text-zinc-400 w-6">
                  {lecture.order}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-800 dark:text-zinc-100 truncate">
                    {lecture.title}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">
                    {lecture.videoUrl && "🎬 "}
                    {lecture.noteUrl && "📄 "}
                    {lecture.isFree && (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        ফ্রি
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(lecture)}
                  className="px-3 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                >
                  এডিট
                </button>
                <button
                  onClick={() => setDeleteTarget(lecture._id)}
                  className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                >
                  ডিলিট
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function LectureManagePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><p className="text-zinc-500">লোড হচ্ছে...</p></div>}>
      <LectureManageContent />
    </Suspense>
  );
}
