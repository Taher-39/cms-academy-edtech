"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";

type LiveClassItem = {
  _id: string;
  courseId?: string;
  courseTitle?: string;
  title: string;
  dateTime: string;
  meetLink: string;
  recordedLecture?: string | null;
};

type LectureOption = { _id: string; title: string };

export default function LiveClassManagePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();

  const [courses, setCourses] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
  const [lecturesByCourse, setLecturesByCourse] = useState<Record<string, LectureOption[]>>({});
  const [recordingSelections, setRecordingSelections] = useState<Record<string, string>>({});
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // create
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({
    courseId: "",
    title: "",
    dateTime: "",
    meetLink: "",
  });

  // edit
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLiveId, setEditingLiveId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    dateTime: "",
    meetLink: "",
  });

  const [saving, setSaving] = useState(false);

  const canManageLive =
    user?.role === "teacher" || user?.role === "admin" || user?.role === "superAdmin";

  useEffect(() => {
    if (!token || !canManageLive) {
      addToast("অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const fetchData = async () => {
    try {
      const coursesRes = await api.get("/api/courses");
      setCourses(coursesRes.data.courses || []);

      const allLive: LiveClassItem[] = [];
      const lecturesMap: Record<string, LectureOption[]> = {};
      for (const course of coursesRes.data.courses || []) {
        try {
          const [liveRes, lectRes] = await Promise.all([
            api.get(`/api/courses/${course._id}/live`),
            api.get(`/api/courses/${course._id}/lectures`),
          ]);
          const items = (liveRes.data.liveClasses || []).map((lc: any) => ({
            ...lc,
            courseId: course._id,
            courseTitle: course.title,
          }));
          allLive.push(...items);
          lecturesMap[course._id] = (lectRes.data.lectures || []).map((l: any) => ({
            _id: l._id,
            title: l.title,
          }));
        } catch {
          // skip
        }
      }

      allLive.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setLiveClasses(allLive);
      setLecturesByCourse(lecturesMap);
    } catch {
      addToast("তথ্য লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAttachRecording = async (liveId: string) => {
    const lectureId = recordingSelections[liveId];
    if (!lectureId) {
      addToast("একটি লেকচার নির্বাচন করুন", "error");
      return;
    }
    setAttachingId(liveId);
    try {
      await api.put(`/api/live/${liveId}/record`, { recordedLecture: lectureId });
      addToast("রেকর্ডেড লেকচার সংযুক্ত করা হয়েছে!", "success");
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "সংযুক্ত করা ব্যর্থ";
      addToast(msg, "error");
    } finally {
      setAttachingId(null);
    }
  };

  const dateTimeToInputValue = (isoOrDate: string) => {
    const d = new Date(isoOrDate);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const resetCreate = () => {
    setCreateData({ courseId: "", title: "", dateTime: "", meetLink: "" });
    setShowCreateForm(false);
  };

  const resetEdit = () => {
    setEditingLiveId(null);
    setEditData({ title: "", dateTime: "", meetLink: "" });
    setShowEditForm(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.courseId || !createData.title || !createData.dateTime || !createData.meetLink) {
      addToast("সব ফিল্ড পূরণ করুন", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post(`/api/courses/${createData.courseId}/live`, {
        title: createData.title,
        dateTime: new Date(createData.dateTime).toISOString(),
        meetLink: createData.meetLink,
      });
      addToast("লাইভ ক্লাস তৈরি করা হয়েছে!", "success");
      resetCreate();
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (lc: LiveClassItem) => {
    setEditingLiveId(lc._id);
    setEditData({
      title: lc.title,
      dateTime: dateTimeToInputValue(lc.dateTime),
      meetLink: lc.meetLink,
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLiveId) return;
    if (!editData.title || !editData.dateTime || !editData.meetLink) {
      addToast("সব ফিল্ড পূরণ করুন", "error");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/live/${editingLiveId}`, {
        title: editData.title,
        dateTime: new Date(editData.dateTime).toISOString(),
        meetLink: editData.meetLink,
      });
      addToast("লাইভ ক্লাস আপডেট করা হয়েছে!", "success");
      resetEdit();
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (liveId: string) => {
    const ok = window.confirm("আপনি কি নিশ্চিত? এই লাইভ ক্লাসটি মুছে ফেলা হবে।");
    if (!ok) return;

    setSaving(true);
    try {
      await api.delete(`/api/live/${liveId}`);
      addToast("লাইভ ক্লাস মুছে ফেলা হয়েছে", "success");
      resetEdit();
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "মুছে ফেলা ব্যর্থ";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const liveSorted = useMemo(() => liveClasses, [liveClasses]);

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
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">📺 লাইভ ক্লাস ব্যবস্থাপনা</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => {
            resetEdit();
            setShowCreateForm((v) => !v);
          }}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-sm transition"
        >
          {showCreateForm ? "বাতিল" : "+ নতুন লাইভ ক্লাস"}
        </button>

        {showEditForm && (
          <button
            onClick={() => resetEdit()}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300 text-sm"
          >
            এডিট বাতিল
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">নতুন লাইভ ক্লাস শিডিউল</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">কোর্স *</label>
              <select
                value={createData.courseId}
                onChange={(e) => setCreateData((prev) => ({ ...prev, courseId: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              >
                <option value="">কোর্স নির্বাচন করুন</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">শিরোনাম *</label>
              <input
                type="text"
                value={createData.title}
                onChange={(e) => setCreateData((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                placeholder="যেমন: বীজগণিত রিভিউ ক্লাস"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">তারিখ ও সময় *</label>
              <input
                type="datetime-local"
                value={createData.dateTime}
                onChange={(e) => setCreateData((prev) => ({ ...prev, dateTime: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Google Meet লিংক *</label>
              <input
                type="url"
                value={createData.meetLink}
                onChange={(e) => setCreateData((prev) => ({ ...prev, meetLink: e.target.value }))}
                required
                placeholder="https://meet.google.com/..."
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
            >
              {saving ? "তৈরি হচ্ছে..." : "লাইভ ক্লাস তৈরি করুন"}
            </button>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {showEditForm && editingLiveId && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">লাইভ ক্লাস এডিট</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">শিরোনাম *</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">তারিখ ও সময় *</label>
              <input
                type="datetime-local"
                value={editData.dateTime}
                onChange={(e) => setEditData((prev) => ({ ...prev, dateTime: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Google Meet লিংক *</label>
              <input
                type="url"
                value={editData.meetLink}
                onChange={(e) => setEditData((prev) => ({ ...prev, meetLink: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
              >
                {saving ? "সেভ হচ্ছে..." : "আপডেট"}
              </button>
              <button
                type="button"
                onClick={resetEdit}
                className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Classes List */}
      {liveSorted.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো লাইভ ক্লাস নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {liveSorted.map((lc) => {
            const isPast = new Date(lc.dateTime) < new Date();
            return (
              <div
                key={lc._id}
                className={`p-5 rounded-xl border bg-white dark:bg-zinc-900 ${
                  isPast
                    ? "border-zinc-200 dark:border-zinc-700 opacity-60"
                    : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
                        {lc.courseTitle || "Unknown"}
                      </span>
                      {isPast ? (
                        <span className="text-xs text-red-500 font-medium">শেষ হয়েছে</span>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">আসন্ন</span>
                      )}
                    </div>

                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">{lc.title}</h3>

                    <p className="text-sm text-zinc-500 mt-1">
                      🗓{" "}
                      {new Date(lc.dateTime).toLocaleDateString("bn-BD", {
                        dateStyle: "full",
                      })}{" "}
                      —{" "}
                      {new Intl.DateTimeFormat("bn-BD", {
                        timeStyle: "short",
                      }).format(new Date(lc.dateTime))}
                    </p>

                    <a
                      href={lc.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mt-2 inline-block"
                    >
                      🔗 মিট লিংক
                    </a>

                    {lc.recordedLecture && (
                      <p className="text-xs text-green-600 mt-1">✅ রেকর্ডিং সংযুক্ত হয়েছে</p>
                    )}

                    {isPast && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                          value={recordingSelections[lc._id] || ""}
                          onChange={(e) =>
                            setRecordingSelections((prev) => ({ ...prev, [lc._id]: e.target.value }))
                          }
                          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                        >
                          <option value="">
                            {lc.recordedLecture ? "রেকর্ডিং পরিবর্তন করুন" : "লেকচার নির্বাচন করুন"}
                          </option>
                          {(lc.courseId ? lecturesByCourse[lc.courseId] : [])?.map((l) => (
                            <option key={l._id} value={l._id}>
                              {l.title}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAttachRecording(lc._id)}
                          disabled={attachingId === lc._id}
                          className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 disabled:opacity-50 transition"
                        >
                          {attachingId === lc._id ? "সংযুক্ত হচ্ছে..." : "রেকর্ডিং সংযুক্ত করুন"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(lc)}
                      className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-900 transition"
                    >
                      এডিট
                    </button>
                    <button
                      onClick={() => handleDelete(lc._id)}
                      className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                    >
                      ডিলিট
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

