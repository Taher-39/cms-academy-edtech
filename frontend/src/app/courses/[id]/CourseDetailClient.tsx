"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import Link from "next/link";
import { useToast } from "@/src/components/Toast";
import YouTubeEmbed from "@/src/components/YouTubeEmbed";
import QnAThread from "@/src/components/QnAThread";

interface CourseData {
  _id: string;
  title: string;
  description: string;
  category: string;
  classLevel: string;
  subject: string;
  type: string;
  price: number;
  regularPrice?: number;
  discountPercent?: number;
  enrollStartDate?: string;
  enrollEndDate?: string;
  courseDurationDays?: number;
  thumbnail?: string;
  outline: string;
  teacher?: { _id: string; name: string; email?: string };
  isLive: boolean;
  liveMeetingLink?: string;
}

interface LectureData {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  noteUrl?: string;
  order: number;
  isFree: boolean;
}

interface LiveClassData {
  _id: string;
  title: string;
  dateTime: string;
  meetLink: string;
}

interface Props {
  course: CourseData;
  lectures: LectureData[];
  liveClasses: LiveClassData[];
}

export default function CourseDetailClient({
  course,
  lectures: initialLectures,
  liveClasses,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [lectures, setLectures] = useState(initialLectures);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    if (paymentStatus === "success") {
      setPaymentMsg("পেমেন্ট সফল হয়েছে! আপনি এখন এই কোর্সে এনরোল্ড।");
      addToast("পেমেন্ট সফল! কোর্সে এনরোল্ড হয়েছেন 🎉", "success");
      setIsEnrolled(true);
    } else if (paymentStatus === "failed") {
      setPaymentMsg("পেমেন্ট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      addToast("পেমেন্ট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।", "error");
    } else if (paymentStatus === "cancelled") {
      setPaymentMsg("পেমেন্ট বাতিল করা হয়েছে।");
      addToast("পেমেন্ট বাতিল করা হয়েছে।", "warning");
    }
  }, [paymentStatus]);

  useEffect(() => {
    // Check enrollment status
    const checkAccess = async () => {
      if (!token) return;
      try {
        const res = await api.get(
          `/api/enrollments/${course._id}/access`
        );
        if (res.data.hasAccess) {
          setIsEnrolled(true);
          // Fetch all lectures including paid ones
          const lectRes = await api.get(
            `/api/courses/${course._id}/lectures`
          );
          setLectures(lectRes.data.lectures);
        }
      } catch {
        // Not enrolled
      }
    };
    checkAccess();
  }, [token, course._id]);

  // Check enrollment window
  const now = new Date();
  const enrollStart = course.enrollStartDate ? new Date(course.enrollStartDate) : null;
  const enrollEnd = course.enrollEndDate ? new Date(course.enrollEndDate) : null;
  const isEnrollOpen =
    !enrollStart || !enrollEnd
      ? true // No window set = always open
      : now >= enrollStart && now <= enrollEnd;
  const enrollNotStarted = enrollStart && now < enrollStart;
  const enrollExpired = enrollEnd && now > enrollEnd;

  const handleEnroll = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!isEnrollOpen) {
      if (enrollNotStarted) {
        const msg = `এনরোলমেন্ট শুরু হবে ${enrollStart!.toLocaleDateString("bn-BD")}`;
        setPaymentMsg(msg);
        addToast(msg, "info");
      } else if (enrollExpired) {
        const msg = "এই কোর্সে এনরোলমেন্ট শেষ হয়েছে।";
        setPaymentMsg(msg);
        addToast(msg, "error");
      }
      return;
    }

    if (course.price === 0) {
      // Free course - enroll directly
      setLoading(true);
      try {
        await api.post("/api/enroll", { courseId: course._id });
        setIsEnrolled(true);
        setPaymentMsg("ফ্রি কোর্সে এনরোলমেন্ট সফল!");
        addToast("ফ্রি কোর্সে এনরোলমেন্ট সফল! 🎉", "success");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "এনরোলমেন্ট ব্যর্থ";
        setPaymentMsg(msg);
        addToast(msg, "error");
      } finally {
        setLoading(false);
      }
    } else {
      // Paid course - redirect to payment
      setLoading(true);
      try {
        const res = await api.post("/api/payment/init", {
          courseId: course._id,
          couponCode: couponCode.trim() || undefined,
        });
        if (res.data.url) {
          window.location.href = res.data.url;
        } else {
          addToast("পেমেন্ট গেটওয়ে URL পাওয়া যায়নি", "error");
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "পেমেন্ট ইনিশিয়ালাইজেশন ব্যর্থ";
        setPaymentMsg(msg);
        addToast(msg, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const categoryLabel =
    course.category === "academic" ? "একাডেমিক" : "চাকরি";
  const classLevelLabel =
    course.classLevel === "6-8"
      ? "৬ষ্ঠ-৮ম"
      : course.classLevel === "9-10"
      ? "৯ম-১০ম"
      : course.classLevel === "11-12"
      ? "১১শ-১২শ"
      : "চাকরি";
  const typeLabel =
    course.type === "full"
      ? "পূর্ণ কোর্স"
      : course.type === "revision"
      ? "রিভিশন"
      : course.type === "mcq"
      ? "MCQ"
      : "চ্যাপ্টার";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Payment message */}
      {paymentMsg && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm ${
            paymentMsg.includes("সফল")
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          }`}
        >
          {paymentMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400">
                {categoryLabel}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                {classLevelLabel}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                {course.subject}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                {typeLabel}
              </span>
            </div>

            <h1 className="text-3xl font-bold mb-2 text-zinc-800 dark:text-zinc-100">
              {course.title}
            </h1>
            <p className="text-zinc-500">
              শিক্ষক: {course.teacher?.name || "অজানা"}
            </p>

            {course.isLive && course.liveMeetingLink && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  🎥 লাইভ ক্লাস চলছে
                </p>
                <a
                  href={course.liveMeetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-800 dark:text-zinc-500 hover:underline text-sm"
                >
                  Google Meet - এ যোগ দিন
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-zinc-800 dark:text-zinc-100">
              কোর্স সম্পর্কে
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          </div>

          {/* Outline */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-zinc-800 dark:text-zinc-100">
              কোর্স আউটলাইন
            </h2>
            <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
              {course.outline}
            </div>
          </div>

          {/* Lectures */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
              লেকচারসমূহ
            </h2>
            {lectures.length === 0 ? (
              <p className="text-zinc-500">কোনো লেকচার নেই</p>
            ) : (
              <div className="space-y-3">
                {lectures.map((lecture, index) => (
                  <div
                    key={lecture._id}
                    className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-zinc-800 dark:text-zinc-100">
                          {index + 1}. {lecture.title}
                        </h3>
                        {lecture.description && (
                          <p className="text-sm text-zinc-500 mt-1">
                            {lecture.description}
                          </p>
                        )}
                      </div>
                      {lecture.isFree && (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ml-2">
                          ফ্রি
                        </span>
                      )}
                    </div>

                    {(lecture.isFree || isEnrolled) && (
                      <div className="mt-3 space-y-3">
                        {lecture.videoUrl && (
                          <YouTubeEmbed url={lecture.videoUrl} title={lecture.title} />
                        )}
                        {lecture.noteUrl && (
                          <a
                            href={lecture.noteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition"
                          >
                            📄 নোট ডাউনলোড করুন
                          </a>
                        )}
                      </div>
                    )}

                    {!lecture.isFree && !isEnrolled && (
                      <p className="text-xs text-zinc-400 mt-2">
                        এই লেকচারটি দেখতে এনরোল করুন
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isEnrolled && lectures.length > 0 && (
              <p className="text-sm text-zinc-500 mt-4">
                প্রথম ৩ টি লেকচার ফ্রি। বাকিগুলো দেখতে কোর্সে এনরোল করুন।
              </p>
            )}
          </div>

          {/* Live Classes */}
          {liveClasses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
                আসন্ন লাইভ ক্লাস
              </h2>
              <div className="space-y-3">
                {liveClasses.map((lc) => (
                  <div
                    key={lc._id}
                    className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                  >
                    <h3 className="font-medium text-zinc-800 dark:text-zinc-100">
                      {lc.title}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      🗓{" "}
                      {new Date(lc.dateTime).toLocaleDateString("bn-BD", {
                        dateStyle: "full",
                      })}{" "}
                      -{" "}
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
                      🔗 Google Meet - এ যোগ দিন
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Q&A Section */}
          {isEnrolled && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
                প্রশ্ন ও উত্তর
              </h2>
              <QnAThread courseId={course._id} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full aspect-video object-cover rounded-lg mb-4"
              />
            )}

            {/* Price display */}
            <div className="mb-4">
              {course.price === 0 ? (
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">ফ্রি</p>
              ) : (
                <div>
                  <div className="flex items-end gap-2 flex-wrap">
                    <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-500">
                      ৳{course.price}
                    </p>
                    {course.regularPrice && course.regularPrice > course.price && (
                      <>
                        <p className="text-lg text-zinc-400 line-through">
                          ৳{course.regularPrice}
                        </p>
                        {course.discountPercent && course.discountPercent > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold">
                            -{course.discountPercent}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    পূর্বের ছাত্রদের জন্য অতিরিক্ত ২০০ টাকা ছাড়
                  </p>
                </div>
              )}
            </div>

            {!isEnrolled && course.price > 0 && (
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
                  কুপন কোড (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="যেমন: SAVE100"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
            )}

            {isEnrolled ? (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium text-center">
                ✅ আপনি এনরোল্ড
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={loading || (!isEnrollOpen && !enrollNotStarted && !enrollExpired) || enrollExpired === true}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-semibold transition"
              >
                {loading
                  ? "প্রসেসিং..."
                  : enrollNotStarted
                  ? "শীঘ্রই শুরু হবে"
                  : enrollExpired
                  ? "এনরোলমেন্ট শেষ"
                  : course.price === 0
                  ? "ফ্রি এনরোল করুন"
                  : "এনরোল করুন"}
              </button>
            )}

            <div className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <p>📚 {lectures.length} টি লেকচার</p>
              <p>👨‍🏫 {course.teacher?.name || "শিক্ষক"}</p>
              <p>📖 {typeLabel}</p>
              {course.courseDurationDays && (
                <p>⏱ {course.courseDurationDays} দিনের অ্যাক্সেস</p>
              )}
              {course.isLive && <p>🎥 লাইভ ক্লাস</p>}
              {course.enrollStartDate && (
                <p>📅 এনরোল শুরু: {new Date(course.enrollStartDate).toLocaleDateString("bn-BD")}</p>
              )}
              {course.enrollEndDate && (
                <p>📅 এনরোল শেষ: {new Date(course.enrollEndDate).toLocaleDateString("bn-BD")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
