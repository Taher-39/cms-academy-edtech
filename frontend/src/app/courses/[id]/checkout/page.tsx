"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import Link from "next/link";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";

const PAYMENT_NUMBER = "01793952014";

const paymentMethods = [
  { value: "bKash", label: "bKash", icon: "💸" },
  { value: "Nagad", label: "Nagad", icon: "🟡" },
  { value: "Rocket", label: "Rocket", icon: "🚀" },
];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [paymentMethod, setPaymentMethod] = useState("bKash");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // SSLCommerz enabled?
  const sslcommerzEnabled = process.env.NEXT_PUBLIC_PAYMENT_MODE === "sslcommerz";

  useEffect(() => {
    if (!token) {
      router.push(loginUrlWithRedirect(`/courses/${courseId}/checkout`));
      return;
    }
    fetchCourse();
  }, [token, courseId]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/api/courses/${courseId}`);
      setCourse(res.data.course || res.data);
    } catch {
      addToast("কোর্স লোড করতে ব্যর্থ", "error");
    } finally {
      setLoading(false);
    }
  };

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

  // Upload screenshot to Cloudinary via backend
  const uploadScreenshot = async (file: File): Promise<string | undefined> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/payment/manual/upload-screenshot", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.url;
    } catch {
      // If upload fails, proceed without screenshot
      addToast("স্ক্রিনশট আপলোড ব্যর্থ, ফর্ম সাবমিট হচ্ছে...", "warning");
      return undefined;
    }
  };

  const handleManualSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      addToast("আপনার মোবাইল নাম্বার দিন (যে নাম্বার থেকে পেমেন্ট করেছেন)", "error");
      return;
    }
    if (!/^01\d{8,11}$/.test(phoneNumber)) {
      addToast("সঠিক মোবাইল নাম্বার দিন (01XXXXXXXXX)", "error");
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl: string | undefined;
      if (screenshot) {
        screenshotUrl = await uploadScreenshot(screenshot);
      }

      const res = await api.post("/api/payment/manual/submit", {
        courseId,
        phoneNumber,
        paymentMethod,
        screenshot: screenshotUrl,
      });

      setSubmitted(true);
      addToast(res.data.message || "পেমেন্ট সাবমিট হয়েছে!", "success");
    } catch (err: any) {
      const msg = err.response?.data?.message || "সাবমিট ব্যর্থ, আবার চেষ্টা করুন";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSSLCommerz = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/api/payment/init", {
        courseId,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        addToast("পেমেন্ট গেটওয়ে URL পাওয়া যায়নি", "error");
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || "পেমেন্ট শুরু করতে ব্যর্থ", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full mx-auto" />
        <p className="text-zinc-500 mt-4">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">কোর্স পাওয়া যায়নি</p>
        <Link href="/courses" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          কোর্সসমূহে ফিরে যান
        </Link>
      </div>
    );
  }

  const price = course.price || 0;
  const regularPrice = course.regularPrice;
  const discount = regularPrice ? regularPrice - price : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-zinc-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:underline">হোম</Link>
        <span>/</span>
        <Link href="/courses" className="hover:underline">কোর্সসমূহ</Link>
        <span>/</span>
        <Link href={`/courses/${courseId}`} className="hover:underline truncate max-w-[200px]">
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-zinc-700 dark:text-zinc-300">চেকআউট</span>
      </nav>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        চেকআউট
      </h1>

      {/* Course Summary */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 mb-8 border border-zinc-200 dark:border-zinc-700">
        <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">{course.title}</h2>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ৳{price}
          </span>
          {regularPrice && regularPrice > price && (
            <>
              <span className="text-sm line-through text-zinc-400">৳{regularPrice}</span>
              <span className="text-sm text-green-600 font-medium">
                {discount}৳ ছাড়
              </span>
            </>
          )}
        </div>
      </div>

      {submitted ? (
        /* Success state */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            পেমেন্ট সাবমিট হয়েছে!
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            অ্যাডমিন আপনার পেমেন্ট ভেরিফাই করলে আপনি কোর্সে এনরোল্ড হয়ে যাবেন। সাধারণত ২৪ ঘন্টার মধ্যে ভেরিফাই করা হয়।
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard/my-courses"
              className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition"
            >
              মাই কোর্স
            </Link>
            <Link
              href="/courses"
              className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              আরও কোর্স দেখুন
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* SSLCommerz Option */}
          {sslcommerzEnabled && (
            <div className="mb-8">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3">
                অনলাইন পেমেন্ট (SSLCommerz)
              </h3>
              <button
                onClick={handleSSLCommerz}
                disabled={submitting}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>💳</span> SSLCommerz দিয়ে পেমেন্ট করুন
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual Payment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
                মোবাইল ব্যাংকিং (bKash / Nagad / Rocket)
              </h3>
              {!sslcommerzEnabled && (
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                  সহজ
                </span>
              )}
            </div>

            {/* Payment Instructions */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                📌 কিভাবে পেমেন্ট করবেন:
              </h4>
              <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-1.5 list-decimal list-inside">
                <li>
                  <strong>{PAYMENT_NUMBER}</strong> নাম্বারে bKash/Nagad/Rocket-এ{' '}
                  <strong>৳{price}</strong> টাকা পাঠান
                </li>
                <li>যে নাম্বার থেকে টাকা পাঠাবেন, সেটা নিচের ফর্মে লিখুন</li>
                <li>পেমেন্টের স্ক্রিনশট দিন (optional)</li>
                <li>সাবমিট করার পর অ্যাডমিন ভেরিফাই করবে</li>
              </ol>
            </div>

            {/* Manual Payment Form */}
            <div className="space-y-5">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  পেমেন্ট মাধ্যম *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition ${
                        paymentMethod === m.value
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      <span className="text-lg block mb-1">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  আপনার মোবাইল নাম্বার (যে নাম্বার থেকে পেমেন্ট করেছেন) *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  maxLength={14}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  পেমেন্ট স্ক্রিনশট (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-200 dark:hover:file:bg-zinc-700 transition cursor-pointer"
                />
                {screenshotPreview && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-w-[200px] max-h-[200px] rounded-lg border border-zinc-200 dark:border-zinc-700 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshot(null);
                        setScreenshotPreview(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="w-full py-3.5 px-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full" />
                    <span>সাবমিট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span> পেমেন্ট সাবমিট করুন
                  </>
                )}
              </button>

              <p className="text-xs text-center text-zinc-400">
                সাবমিট করার পর অ্যাডমিন ভেরিফাই করবে। প্রশ্ন থাকলে{' '}
                <Link href="/contact" className="text-blue-600 hover:underline">
                  যোগাযোগ করুন
                </Link>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
