"use client";

import { useEffect, useState, useRef } from "react";
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

const PAYMENT_NUMBER = "01793952014";
const paymentMethods = [
  { value: "bKash", label: "bKash", icon: "💸" },
  { value: "Nagad", label: "Nagad", icon: "🟡" },
  { value: "Rocket", label: "Rocket", icon: "🚀" },
];

export default function BookSessionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pricePerHour, setPricePerHour] = useState(200);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [teacherId, setTeacherId] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [series, setSeries] = useState("");
  const [topics, setTopics] = useState("");
  const [requestedSchedule, setRequestedSchedule] = useState("");
  const [durationHours, setDurationHours] = useState(1);

  // Manual payment fields
  const [paymentMethod, setPaymentMethod] = useState("bKash");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const sslcommerzEnabled = process.env.NEXT_PUBLIC_PAYMENT_MODE === "sslcommerz";

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
  const minSchedule = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast("ছবির সাইজ 5MB এর বেশি হতে পারবে না", "error");
      return;
    }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const uploadScreenshot = async (file: File): Promise<string | undefined> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/payment/manual/upload-screenshot", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.url;
    } catch {
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !subject.trim() || !topics.trim() || !requestedSchedule) {
      addToast("সব ঘর পূরণ করুন", "error");
      return;
    }
    setSubmitting(true);

    if (sslcommerzEnabled) {
      // SSLCommerz flow
      try {
        const res = await api.post("/api/sessions/init", {
          teacherId,
          subject: subject.trim(),
          chapter: chapter.trim(),
          series: series.trim(),
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
    } else {
      // Manual payment flow
      if (!phoneNumber || phoneNumber.length < 10) {
        addToast("আপনার মোবাইল নাম্বার দিন (যে নাম্বার থেকে পেমেন্ট করেছেন)", "error");
        setSubmitting(false);
        return;
      }
      try {
        let screenshotUrl: string | undefined;
        if (screenshot) {
          screenshotUrl = await uploadScreenshot(screenshot);
        }

        await api.post("/api/sessions/manual-init", {
          teacherId,
          subject: subject.trim(),
          chapter: chapter.trim(),
          series: series.trim(),
          topics: topics.trim(),
          requestedSchedule: new Date(requestedSchedule).toISOString(),
          durationHours,
          paymentMethod,
          phoneNumber,
          screenshot: screenshotUrl,
        });
        setSubmitted(true);
        addToast("সেশন বুকিং সাবমিট হয়েছে!", "success");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "বুকিং ব্যর্থ হয়েছে";
        addToast(msg, "error");
      } finally {
        setSubmitting(false);
      }
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
      ) : submitted ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            সেশন বুকিং সাবমিট হয়েছে!
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            অ্যাডমিন পেমেন্ট ভেরিফাই করলে আপনার সেশনটি শিক্ষকের কাছে পাঠানো হবে।
          </p>
          <Link
            href="/dashboard/sessions"
            className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition"
          >
            আমার সেশন দেখুন
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          {/* Teacher Selection */}
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
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">বিষয় *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="যেমন: উচ্চতর গণিত" required
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none" />
          </div>

          {/* Chapter (অধ্যায়) */}
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">অধ্যায়</label>
            <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)}
              placeholder="যেমন: অধ্যায় ৩ — বীজগণিত"
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none" />
          </div>

          {/* Series (সিরিজ) */}
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">সিরিজ</label>
            <input type="text" value={series} onChange={(e) => setSeries(e.target.value)}
              placeholder="যেমন: Model Test Series — 01"
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none" />
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              টপিক / কী নিয়ে সাহায্য দরকার *
            </label>
            <textarea value={topics} onChange={(e) => setTopics(e.target.value)} rows={3}
              placeholder="যেমন: ত্রিকোণমিতি — সূত্র প্রয়োগ নিয়ে সমস্যা হচ্ছে" required
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none" />
          </div>

          {/* Schedule + Duration */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                পছন্দের সময়সূচী *
              </label>
              <input type="datetime-local" value={requestedSchedule} min={minSchedule}
                onChange={(e) => setRequestedSchedule(e.target.value)} required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                সময়কাল (ঘণ্টা) *
              </label>
              <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none">
                {[1, 2, 3, 4].map((h) => (
                  <option key={h} value={h}>{h} ঘণ্টা</option>
                ))}
              </select>
            </div>
          </div>

          {/* Total */}
          <div className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">মোট ফি</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">৳{totalPrice}</span>
          </div>

          {/* Manual Payment Section */}
          {!sslcommerzEnabled && (
            <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">📌 পেমেন্ট নির্দেশনা:</h4>
                <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                  <li><strong>{PAYMENT_NUMBER}</strong> নাম্বারে <strong>৳{totalPrice}</strong> পাঠান</li>
                  <li>যে নাম্বার থেকে পেমেন্ট করবেন তা নিচে লিখুন</li>
                  <li>পেমেন্ট মাধ্যম সিলেক্ট করুন</li>
                  <li>স্ক্রিনশট দিন (optional)</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">পেমেন্ট মাধ্যম *</label>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.map((m) => (
                    <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition ${
                        paymentMethod === m.value
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}>
                      <span className="text-lg block mb-1">{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  আপনার মোবাইল নাম্বার (যে নাম্বার থেকে পেমেন্ট করেছেন) *
                </label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX" maxLength={14}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">স্ক্রিনশট (optional)</label>
                <input type="file" accept="image/*" onChange={handleScreenshotChange}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-300 transition cursor-pointer" />
                {screenshotPreview && (
                  <div className="mt-3 relative inline-block">
                    <img src={screenshotPreview} alt="Preview" className="max-w-[150px] max-h-[150px] rounded-lg border object-cover" />
                    <button type="button" onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting || !teacherId}
            className="w-full py-3 bg-[#D97757] hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-semibold transition">
            {submitting ? "প্রসেসিং..." : sslcommerzEnabled ? `৳${totalPrice} পরিশোধ করে বুক করুন` : "বুকিং সাবমিট করুন"}
          </button>
          <p className="text-xs text-zinc-500 text-center">
            {sslcommerzEnabled
              ? "পেমেন্টের পর শিক্ষক আপনার রিকোয়েস্ট গ্রহণ করলে মিট লিংক পাবেন"
              : "অ্যাডমিন পেমেন্ট ভেরিফাই করার পর সেশনটি শিক্ষকের কাছে যাবে"}
          </p>
        </form>
      )}
    </div>
  );
}
