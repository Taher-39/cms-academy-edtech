"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import DeleteConfirmDialog from "@/src/components/DeleteConfirmDialog";

interface Course {
  _id: string;
  title: string;
  category: string;
  classLevel: string;
  subject: string;
  type: string;
  price: number;
  isLive: boolean;
  lectures: string[];
  enrolledStudents: string[];
  createdAt: string;
  status: string;
  isFeatured: boolean;
}

export default function ManageCoursesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "academic",
    classLevel: "9-10",
    subject: "",
    type: "full",
    price: 0,
    regularPrice: 0,
    outline: "",
    courseDurationDays: 180,
    isLive: false,
    liveMeetingLink: "",
    enrollStartDate: "",
    enrollEndDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      addToast("লগইন প্রয়োজন", "error");
      router.push("/login");
      return;
    }
    if (user?.role === "student") {
      addToast("এই পেজে অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchCourses();
  }, [token, user, router]);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/api/courses");
      setCourses(res.data.courses);
    } catch {
      addToast("কোর্স লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "price" || name === "regularPrice" || name === "courseDurationDays"
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "academic",
      classLevel: "9-10",
      subject: "",
      type: "full",
      price: 0,
      regularPrice: 0,
      outline: "",
      courseDurationDays: 180,
      isLive: false,
      liveMeetingLink: "",
      enrollStartDate: "",
      enrollEndDate: "",
    });
    setEditingId(null);
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  const handleEdit = (course: Course) => {
    setFormData({
      title: course.title,
      description: "",
      category: course.category,
      classLevel: course.classLevel,
      subject: course.subject,
      type: course.type,
      price: course.price,
      regularPrice: 0,
      outline: "",
      courseDurationDays: 180,
      isLive: course.isLive,
      liveMeetingLink: "",
      enrollStartDate: "",
      enrollEndDate: "",
    });
    setEditingId(course._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/api/courses/${editingId}`, formData);
        addToast("কোর্স আপডেট করা হয়েছে!", "success");
      } else {
        await api.post("/api/courses", formData);
        addToast("কোর্স তৈরি করা হয়েছে!", "success");
      }
      resetForm();
      fetchCourses();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const isAdminViewer = user?.role === "admin" || user?.role === "superAdmin";

  const handleStatusChange = async (courseId: string, status: string) => {
    try {
      await api.put(`/api/courses/${courseId}`, { status });
      addToast(
        status === "approved" ? "কোর্স অনুমোদন করা হয়েছে!" : "কোর্স বাতিল করা হয়েছে!",
        "success"
      );
      fetchCourses();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    }
  };

  const handleFeatureToggle = async (course: Course) => {
    try {
      await api.put(`/api/courses/${course._id}`, { isFeatured: !course.isFeatured });
      addToast(
        !course.isFeatured ? "কোর্স ফিচার্ড করা হয়েছে!" : "ফিচার্ড বাতিল করা হয়েছে!",
        "success"
      );
      fetchCourses();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/courses/${deleteTarget}`);
      addToast("কোর্স মুছে ফেলা হয়েছে!", "success");
      setDeleteTarget(null);
      fetchCourses();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "মুছে ফেলা ব্যর্থ";
      addToast(msg, "error");
      setDeleteTarget(null);
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            কোর্স ম্যানেজমেন্ট
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {user?.role === "admin" ? "সব কোর্স পরিচালনা করুন" : "আপনার কোর্সগুলি পরিচালনা করুন"}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-sm transition"
        >
          + নতুন কোর্স
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
            {editingId ? "কোর্স এডিট করুন" : "নতুন কোর্স তৈরি করুন"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  কোর্সের শিরোনাম *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  বিষয় *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                  placeholder="যেমন: গণিত, উচ্চতর গণিত, আইসিটি"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  ক্যাটাগরি *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                >
                  <option value="academic">একাডেমিক</option>
                  <option value="job">চাকরি</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  শ্রেণী *
                </label>
                <select
                  name="classLevel"
                  value={formData.classLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                >
                  <option value="6-8">৬ষ্ঠ-৮ম</option>
                  <option value="9-10">৯ম-১০ম</option>
                  <option value="11-12">১১শ-১২শ</option>
                  <option value="job">চাকরি</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  কোর্স টাইপ *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                >
                  <option value="full">পূর্ণ কোর্স</option>
                  <option value="revision">রিভিশন</option>
                  <option value="mcq">MCQ</option>
                  <option value="chapter">চ্যাপ্টার</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  মূল্য (৳)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min={0}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  রেগুলার প্রাইস (৳) — ছাড় দেখানোর জন্য
                </label>
                <input
                  type="number"
                  name="regularPrice"
                  value={formData.regularPrice}
                  onChange={handleInputChange}
                  min={0}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  মেয়াদ (দিন)
                </label>
                <input
                  type="number"
                  name="courseDurationDays"
                  value={formData.courseDurationDays}
                  onChange={handleInputChange}
                  min={1}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                বিবরণ *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                কোর্স আউটলাইন *
              </label>
              <textarea
                name="outline"
                value={formData.outline}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                placeholder="প্রতি লাইনে একটি চ্যাপ্টার লিখুন&#10;যেমন:&#10;অধ্যায় ১: বীজগণিত&#10;অধ্যায় ২: জ্যামিতি"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isLive"
                checked={formData.isLive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isLive: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <label className="text-sm text-zinc-700 dark:text-zinc-300">
                লাইভ কোর্স
              </label>
            </div>

            {formData.isLive && (
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  লাইভ মিট লিংক
                </label>
                <input
                  type="url"
                  name="liveMeetingLink"
                  value={formData.liveMeetingLink}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
              >
                {saving
                  ? "সেভ হচ্ছে..."
                  : editingId
                  ? "আপডেট করুন"
                  : "কোর্স তৈরি করুন"}
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

      {/* Course List */}
      <div className="space-y-3">
        {courses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <p className="text-zinc-500 mb-2">কোনো কোর্স নেই</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="text-zinc-800 dark:text-zinc-500 hover:underline text-sm"
            >
              প্রথম কোর্স তৈরি করুন
            </button>
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course._id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                  {course.title}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400">
                    {course.category === "academic" ? "একাডেমিক" : "চাকরি"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                    {course.classLevel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                    {course.subject}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                    {course.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      course.status === "approved"
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                        : course.status === "rejected"
                        ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                        : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                    }`}
                  >
                    {course.status === "approved"
                      ? "অনুমোদিত"
                      : course.status === "rejected"
                      ? "বাতিল"
                      : "পেন্ডিং"}
                  </span>
                  {course.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                      ⭐ ফিচার্ড
                    </span>
                  )}
                  <span className="text-zinc-500">
                    ৳{course.price} | {course.lectures?.length || 0} লেকচার |{" "}
                    {course.enrolledStudents?.length || 0} শিক্ষার্থী
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <Link
                  href={`/courses/${course._id}`}
                  className="px-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                >
                  দেখুন
                </Link>
                <Link
                  href={`/dashboard/lectures?courseId=${course._id}`}
                  className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition"
                >
                  লেকচার
                </Link>
                {isAdminViewer && course.status !== "approved" && (
                  <button
                    onClick={() => handleStatusChange(course._id, "approved")}
                    className="px-3 py-1.5 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition"
                  >
                    অনুমোদন
                  </button>
                )}
                {isAdminViewer && course.status !== "rejected" && (
                  <button
                    onClick={() => handleStatusChange(course._id, "rejected")}
                    className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                  >
                    বাতিল
                  </button>
                )}
                {isAdminViewer && (
                  <button
                    onClick={() => handleFeatureToggle(course)}
                    className="px-3 py-1.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition"
                  >
                    {course.isFeatured ? "ফিচার্ড বাতিল" : "ফিচার্ড করুন"}
                  </button>
                )}
                <button
                  onClick={() => handleEdit(course)}
                  className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400 rounded-lg hover:bg-zinc-300 dark:hover:bg-blue-900/60 transition"
                >
                  এডিট
                </button>
                <button
                  onClick={() => setDeleteTarget(course._id)}
                  className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                >
                  ডিলিট
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        title="কোর্স মুছে ফেলুন"
        message="আপনি কি নিশ্চিত? এই কোর্স ও এর সকল লেকচার স্থায়ীভাবে মুছে যাবে।"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
