"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";

interface Teacher {
  _id: string;
  name: string;
  avatar?: string;
  subjects: string[];
}

export default function BookSessionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pricePerHour, setPricePerHour] = useState(200);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [teacherId, setTeacherId] = useState("");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");
  const [requestedSchedule, setRequestedSchedule] = useState("");
  const [durationHours, setDurationHours] = useState(1);

  useEffect(() => {
    if (!token) {
      router.push(loginUrlWithRedirect(pathname));
      return;
    }
    if (user && user.role !== "student") {
      addToast("শুধুমাত্র শিক্ষার্থীরা সেশন বুক করতে পারবেন", "error");
      router.push("/dashboard");
      return;
    }
    (async () => {
      try {
        const res = await api.get("/api/sessions/teachers");
        setTeachers(res.data.teachers || []);
        setPricePerHour(res.data.pricePerHour || 200);
      } catch {
        addToast("শিক্ষক তালিকা লোড করা যায়নি", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user, router, pathname]);

  const selectedTeacher = teachers.find((t) => t._id === teacherId);
  const totalPrice = pricePerHour * durationHours;

  // Minimum bookable time: 1 hour from now, formatted for datetime-local input
  const minSchedule = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !subject.trim() || !topics.trim() || !requestedSchedule) {
      addToast("সব ঘর পূরণ করুন", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/api/sessions/init", {
        teacherId,
        subject: subject.trim(),
        topics: topics.trim(),
        requestedSchedule: new Date(requestedSchedule).toISOString(),
        durationHours,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        addToast("পেমেন্ট গেটওয়ে URL পাওয়া যায়নি", "error");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "বুকিং ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard/sessions"
          className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
        >
          &larr; আমার সেশন
        </Link>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          🧑‍🏫 ওয়ান-টু-ওয়ান সেশন বুক করুন
        </h1>
        <p className="text-sm text-zinc-500 mt-1">৳{pricePerHour} প্রতি ঘণ্টা</p>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">এই মুহূর্তে কোনো শিক্ষক উপলব্ধ নেই</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              শিক্ষক নির্বাচন করুন *
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {teachers.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setTeacherId(t._id)}
                  className={`text-left p-3 rounded-lg border transition ${
                    teacherId === t._id
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{t.name}</p>
                  {t.subjects.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-0.5">{t.subjects.join(", ")}</p>
                  )}
                </button>
              ))}
            </div>
            {selectedTeacher && (
              <p className="text-xs text-zinc-500 mt-2">নির্বাচিত: {selectedTeacher.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">বিষয় *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="যেমন: উচ্চতর গণিত"
              required
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              টপিক / কী নিয়ে সাহায্য দরকার *
            </label>
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              rows={3}
              placeholder="যেমন: ত্রিকোণমিতি — সূত্র প্রয়োগ নিয়ে সমস্যা হচ্ছে"
              required
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                পছন্দের সময়সূচী *
              </label>
              <input
                type="datetime-local"
                value={requestedSchedule}
                min={minSchedule}
                onChange={(e) => setRequestedSchedule(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                সময়কাল (ঘণ্টা) *
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              >
                {[1, 2, 3, 4].map((h) => (
                  <option key={h} value={h}>
                    {h} ঘণ্টা
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">মোট ফি</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">৳{totalPrice}</span>
          </div>

          <button
            type="submit"
            disabled={submitting || !teacherId}
            className="w-full py-3 bg-[#D97757] hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-semibold transition"
          >
            {submitting ? "প্রসেসিং..." : `৳${totalPrice} পরিশোধ করে বুক করুন`}
          </button>
          <p className="text-xs text-zinc-500 text-center">
            পেমেন্টের পর শিক্ষক আপনার রিকোয়েস্ট গ্রহণ করলে মিট লিংক পাবেন
          </p>
        </form>
      )}
    </div>
  );
}
