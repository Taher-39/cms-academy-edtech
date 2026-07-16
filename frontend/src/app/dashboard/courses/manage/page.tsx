"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import DeleteConfirmDialog from "@/src/components/DeleteConfirmDialog";

interface ScheduleRow {
  day: string;
  time: string;
  subject: string;
}

interface FaqRow {
  question: string;
  answer: string;
}

interface TestimonialRow {
  name: string;
  institution: string;
  rating: number;
  comment: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  title: string;
  description?: string;
  category: string;
  classLevel: string;
  subject: string;
  type: string;
  teacher?: Teacher | string;
  price: number;
  regularPrice?: number;
  outline?: string;
  courseDurationDays?: number;
  isLive: boolean;
  liveMeetingLink?: string;
  thumbnail?: string;
  enrollStartDate?: string;
  enrollEndDate?: string;
  trailerVideoUrl?: string;
  whatYouWillLearn?: string[];
  features?: string[];
  classSchedule?: { day: string; time: string; subject?: string }[];
  faqs?: { question: string; answer: string }[];
  testimonials?: { name: string; institution?: string; rating?: number; comment: string }[];
  lectures: string[];
  enrolledStudents: string[];
  createdAt: string;
  status: string;
  isFeatured: boolean;
}

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  classLevel: string;
  subject: string;
  teacherId: string;
  type: string;
  price: number;
  regularPrice: number;
  outline: string;
  courseDurationDays: number;
  isLive: boolean;
  liveMeetingLink: string;
  thumbnail: string;
  enrollStartDate: string;
  enrollEndDate: string;
  trailerVideoUrl: string;
  whatYouWillLearnText: string;
  featuresText: string;
  classSchedule: ScheduleRow[];
  faqs: FaqRow[];
  testimonials: TestimonialRow[];
}

const dayOptions = [
  { value: "sunday", label: "রবিবার" },
  { value: "monday", label: "সোমবার" },
  { value: "tuesday", label: "মঙ্গলবার" },
  { value: "wednesday", label: "বুধবার" },
  { value: "thursday", label: "বৃহস্পতিবার" },
  { value: "friday", label: "শুক্রবার" },
  { value: "saturday", label: "শনিবার" },
];

const initialFormData: CourseFormData = {
  title: "",
  description: "",
  category: "academic",
  classLevel: "9-10",
  subject: "",
  teacherId: "",
  type: "full",
  price: 0,
  regularPrice: 0,
  outline: "",
  courseDurationDays: 180,
  isLive: false,
  liveMeetingLink: "",
  thumbnail: "",
  enrollStartDate: "",
  enrollEndDate: "",
  trailerVideoUrl: "",
  whatYouWillLearnText: "",
  featuresText: "",
  classSchedule: [],
  faqs: [],
  testimonials: [],
};

export default function ManageCoursesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      addToast("লগইন প্রয়োজন", "error");
      router.push(loginUrlWithRedirect(pathname));
      return;
    }
    if (user?.role === "student") {
      addToast("এই পেজে অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchCourses();
    if (user?.role === "admin" || user?.role === "superAdmin") {
      fetchTeachers();
      fetchCategories();
    }
  }, [token, user, router, pathname]);

  const fetchCourses = async () => {
    try {
      const params = user?.role === "teacher" ? { mine: "true" } : {};
      const res = await api.get("/api/courses", { params });
      setCourses(res.data.courses);
    } catch {
      addToast("কোর্স লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/api/auth/users");
      const allUsers = (res.data.users || []) as (Teacher & { role: string })[];
      setTeachers(allUsers.filter((u) => u.role === "teacher"));
    } catch {
      addToast("শিক্ষকদের তালিকা লোড করা যায়নি", "error");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data.categories || []);
    } catch {
      addToast("বিষয়ের তালিকা লোড করা যায়নি", "error");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : name === "price" || name === "regularPrice" || name === "courseDurationDays"
            ? Number(value)
            : value,
      };
      // ফ্রি কোর্স শুধু রেকর্ডেড হবে — লাইভ/মিট লিংকের অপশন থাকবে না
      if (name === "price" && Number(value) === 0) {
        next.isLive = false;
        next.liveMeetingLink = "";
      }
      return next;
    });
  };

  const isFreeCourse = formData.price === 0;

  // ---- Dynamic list helpers: class schedule ----
  const addScheduleRow = () =>
    setFormData((prev) => ({
      ...prev,
      classSchedule: [...prev.classSchedule, { day: "sunday", time: "", subject: "" }],
    }));
  const updateScheduleRow = (index: number, patch: Partial<ScheduleRow>) =>
    setFormData((prev) => {
      const rows = [...prev.classSchedule];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, classSchedule: rows };
    });
  const removeScheduleRow = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      classSchedule: prev.classSchedule.filter((_, i) => i !== index),
    }));

  // ---- Dynamic list helpers: FAQ ----
  const addFaqRow = () =>
    setFormData((prev) => ({ ...prev, faqs: [...prev.faqs, { question: "", answer: "" }] }));
  const updateFaqRow = (index: number, patch: Partial<FaqRow>) =>
    setFormData((prev) => {
      const rows = [...prev.faqs];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, faqs: rows };
    });
  const removeFaqRow = (index: number) =>
    setFormData((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));

  // ---- Dynamic list helpers: Testimonials ----
  const addTestimonialRow = () =>
    setFormData((prev) => ({
      ...prev,
      testimonials: [...prev.testimonials, { name: "", institution: "", rating: 5, comment: "" }],
    }));
  const updateTestimonialRow = (index: number, patch: Partial<TestimonialRow>) =>
    setFormData((prev) => {
      const rows = [...prev.testimonials];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, testimonials: rows };
    });
  const removeTestimonialRow = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index),
    }));

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  const handleEdit = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description || "",
      category: course.category,
      classLevel: course.classLevel,
      subject: course.subject,
      teacherId: typeof course.teacher === "object" ? course.teacher?._id || "" : course.teacher || "",
      type: course.type,
      price: course.price,
      regularPrice: course.regularPrice || 0,
      outline: course.outline || "",
      courseDurationDays: course.courseDurationDays || 180,
      isLive: course.isLive,
      liveMeetingLink: course.liveMeetingLink || "",
      thumbnail: course.thumbnail || "",
      enrollStartDate: course.enrollStartDate ? course.enrollStartDate.slice(0, 10) : "",
      enrollEndDate: course.enrollEndDate ? course.enrollEndDate.slice(0, 10) : "",
      trailerVideoUrl: course.trailerVideoUrl || "",
      whatYouWillLearnText: (course.whatYouWillLearn || []).join("\n"),
      featuresText: (course.features || []).join("\n"),
      classSchedule: (course.classSchedule || []).map((r) => ({
        day: r.day,
        time: r.time,
        subject: r.subject || "",
      })),
      faqs: course.faqs || [],
      testimonials: (course.testimonials || []).map((t) => ({
        name: t.name,
        institution: t.institution || "",
        rating: t.rating || 5,
        comment: t.comment,
      })),
    });
    setEditingId(course._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("thumbnail", file);
      const res = await api.post("/api/courses/thumbnail", uploadData);
      setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
      addToast("থাম্বনেইল আপলোড হয়েছে", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "থাম্বনেইল আপলোড ব্যর্থ";
      addToast(msg, "error");
    } finally {
      setThumbnailUploading(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      classLevel: formData.classLevel,
      subject: formData.subject,
      teacher: formData.teacherId,
      type: formData.type,
      price: formData.price,
      regularPrice: formData.regularPrice || undefined,
      outline: formData.outline,
      courseDurationDays: formData.courseDurationDays,
      isLive: formData.isLive,
      liveMeetingLink: formData.liveMeetingLink,
      thumbnail: formData.thumbnail,
      enrollStartDate: formData.enrollStartDate || undefined,
      enrollEndDate: formData.enrollEndDate || undefined,
      trailerVideoUrl: formData.trailerVideoUrl || undefined,
      whatYouWillLearn: formData.whatYouWillLearnText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      features: formData.featuresText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      classSchedule: formData.classSchedule.filter((r) => r.day && r.time.trim()),
      faqs: formData.faqs.filter((f) => f.question.trim() && f.answer.trim()),
      testimonials: formData.testimonials.filter((t) => t.name.trim() && t.comment.trim()),
    };

    try {
      if (editingId) {
        await api.put(`/api/courses/${editingId}`, payload);
        addToast("কোর্স আপডেট করা হয়েছে!", "success");
      } else {
        await api.post("/api/courses", payload);
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
            {isAdminViewer ? "সব কোর্স পরিচালনা করুন" : "আপনাকে অ্যাসাইন করা কোর্সগুলির লেকচার পরিচালনা করুন"}
          </p>
        </div>
        {isAdminViewer && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-sm transition"
          >
            + নতুন কোর্স
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isAdminViewer && showForm && (
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
                  list="subject-categories"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                  placeholder="যেমন: গণিত, আইসিটি, বিজ্ঞান, টেক — বা নতুন যেকোনো বিষয়"
                />
                <datalist id="subject-categories">
                  {categories.map((c) => (
                    <option key={c._id} value={c.name} />
                  ))}
                </datalist>
                <Link
                  href="/dashboard/categories"
                  className="text-xs text-zinc-800 dark:text-zinc-500 hover:underline mt-1 inline-block"
                >
                  + নতুন বিষয় যোগ করুন
                </Link>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  শিক্ষক *
                </label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                >
                  <option value="">-- শিক্ষক নির্বাচন করুন --</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    কোনো শিক্ষক নেই —{" "}
                    <Link href="/dashboard/users" className="underline">
                      প্রথমে একজন শিক্ষক তৈরি করুন
                    </Link>
                  </p>
                )}
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
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  এনরোলমেন্ট শুরু (ঐচ্ছিক)
                </label>
                <input
                  type="date"
                  name="enrollStartDate"
                  value={formData.enrollStartDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  এনরোলমেন্ট শেষ (ঐচ্ছিক)
                </label>
                <input
                  type="date"
                  name="enrollEndDate"
                  value={formData.enrollEndDate}
                  onChange={handleInputChange}
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

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  কী কী শিখবেন (প্রতি লাইনে একটি)
                </label>
                <textarea
                  name="whatYouWillLearnText"
                  value={formData.whatYouWillLearnText}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                  placeholder="যেমন:&#10;সৃজনশীল প্রশ্ন সমাধান&#10;MCQ কৌশল"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  এই কোর্সে যা যা থাকছে (প্রতি লাইনে একটি)
                </label>
                <textarea
                  name="featuresText"
                  value={formData.featuresText}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                  placeholder="যেমন:&#10;সাপ্তাহিক লাইভ ক্লাস&#10;চ্যাপ্টার ভিত্তিক লেকচার শীট&#10;সাপ্তাহিক প্রশ্নোত্তর সেশন"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                ট্রেইলার ভিডিও (YouTube লিংক, ঐচ্ছিক)
              </label>
              <input
                type="url"
                name="trailerVideoUrl"
                value={formData.trailerVideoUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                কোর্স থাম্বনেইল (ছবি)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-28 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                  {formData.thumbnail ? (
                    <img
                      src={formData.thumbnail}
                      alt="থাম্বনেইল"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-400">প্রিভিউ নেই</span>
                  )}
                </div>
                <div>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    disabled={thumbnailUploading}
                    className="text-sm text-zinc-600 dark:text-zinc-400"
                  />
                  {thumbnailUploading && (
                    <p className="text-xs text-zinc-500 mt-1">আপলোড হচ্ছে...</p>
                  )}
                </div>
              </div>
            </div>

            {isFreeCourse ? (
              <p className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2">
                ফ্রি কোর্স শুধুমাত্র রেকর্ডেড হবে — লাইভ ক্লাস/মিট লিংক যোগ করার সুবিধা এখানে নেই।
              </p>
            ) : (
              <>
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
                  <>
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

                    {/* Class schedule */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          ক্লাস রুটিন
                        </label>
                        <button
                          type="button"
                          onClick={addScheduleRow}
                          className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        >
                          + রুটিন যোগ করুন
                        </button>
                      </div>
                      <div className="space-y-2">
                        {formData.classSchedule.map((row, index) => (
                          <div key={index} className="flex flex-wrap items-center gap-2">
                            <select
                              value={row.day}
                              onChange={(e) =>
                                updateScheduleRow(index, { day: e.target.value })
                              }
                              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                            >
                              {dayOptions.map((d) => (
                                <option key={d.value} value={d.value}>
                                  {d.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={row.time}
                              onChange={(e) =>
                                updateScheduleRow(index, { time: e.target.value })
                              }
                              placeholder="রাত ৮:৩০"
                              className="w-32 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                            />
                            <input
                              type="text"
                              value={row.subject}
                              onChange={(e) =>
                                updateScheduleRow(index, { subject: e.target.value })
                              }
                              placeholder="বিষয় (ঐচ্ছিক)"
                              className="flex-1 min-w-[120px] px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeScheduleRow(index)}
                              className="text-xs px-2 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                            >
                              মুছুন
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* FAQ */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
                </label>
                <button
                  type="button"
                  onClick={addFaqRow}
                  className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                >
                  + প্রশ্ন যোগ করুন
                </button>
              </div>
              <div className="space-y-3">
                {formData.faqs.map((row, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.question}
                        onChange={(e) => updateFaqRow(index, { question: e.target.value })}
                        placeholder="প্রশ্ন"
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeFaqRow(index)}
                        className="text-xs px-2 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        মুছুন
                      </button>
                    </div>
                    <textarea
                      value={row.answer}
                      onChange={(e) => updateFaqRow(index, { answer: e.target.value })}
                      placeholder="উত্তর"
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  শিক্ষার্থীদের মতামত
                </label>
                <button
                  type="button"
                  onClick={addTestimonialRow}
                  className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                >
                  + মতামত যোগ করুন
                </button>
              </div>
              <div className="space-y-3">
                {formData.testimonials.map((row, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateTestimonialRow(index, { name: e.target.value })}
                        placeholder="শিক্ষার্থীর নাম"
                        className="flex-1 min-w-[120px] px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                      />
                      <input
                        type="text"
                        value={row.institution}
                        onChange={(e) =>
                          updateTestimonialRow(index, { institution: e.target.value })
                        }
                        placeholder="প্রতিষ্ঠান (ঐচ্ছিক)"
                        className="flex-1 min-w-[120px] px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                      />
                      <select
                        value={row.rating}
                        onChange={(e) =>
                          updateTestimonialRow(index, { rating: Number(e.target.value) })
                        }
                        className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>
                            {r} স্টার
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeTestimonialRow(index)}
                        className="text-xs px-2 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        মুছুন
                      </button>
                    </div>
                    <textarea
                      value={row.comment}
                      onChange={(e) => updateTestimonialRow(index, { comment: e.target.value })}
                      placeholder="মন্তব্য"
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

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
            <p className="text-zinc-500 mb-2">
              {isAdminViewer ? "কোনো কোর্স নেই" : "আপনাকে এখনো কোনো কোর্স অ্যাসাইন করা হয়নি"}
            </p>
            {isAdminViewer && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="text-zinc-800 dark:text-zinc-500 hover:underline text-sm"
              >
                প্রথম কোর্স তৈরি করুন
              </button>
            )}
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
                  {typeof course.teacher === "object" && course.teacher?.name && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                      👤 {course.teacher.name}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                    {course.type}
                  </span>
                  {course.isLive && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium">
                      লাইভ
                    </span>
                  )}
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
                <Link
                  href={`/dashboard/quiz/manage?courseId=${course._id}`}
                  className="px-3 py-1.5 text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/60 transition"
                >
                  MCQ
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
                    className="px-3 py-1.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition"
                  >
                    {course.isFeatured ? "ফিচার্ড বাতিল" : "ফিচার্ড করুন"}
                  </button>
                )}
                {isAdminViewer && (
                  <button
                    onClick={() => handleEdit(course)}
                    className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400 rounded-lg hover:bg-zinc-300 dark:hover:bg-blue-900/60 transition"
                  >
                    এডিট
                  </button>
                )}
                {isAdminViewer && (
                  <button
                    onClick={() => setDeleteTarget(course._id)}
                    className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                  >
                    ডিলিট
                  </button>
                )}
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
