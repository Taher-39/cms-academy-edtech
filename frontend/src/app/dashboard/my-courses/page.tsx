"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
    price: number;
    category: string;
    classLevel: string;
  };
  enrolledAt: string;
  expiryAt: string;
  paidAmount: number;
  discountApplied: number;
  progress: { watched: number; total: number; percent: number };
}

export default function MyCoursesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "expired">("active");

  useEffect(() => {
    if (!token) {
      router.push(loginUrlWithRedirect(pathname));
      return;
    }
    (async () => {
      try {
        const res = await api.get("/api/enrollments");
        setEnrollments(res.data.enrollments);
      } catch {
        addToast("কোর্স তথ্য লোড করা যায়নি", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router, pathname]);

  const now = new Date();
  const active = enrollments.filter((e) => new Date(e.expiryAt) >= now);
  const expired = enrollments.filter((e) => new Date(e.expiryAt) < now);
  const list = tab === "active" ? active : expired;

  const daysLeft = (expiryAt: string) => {
    const diff = new Date(expiryAt).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          🎓 আমার কোর্সসমূহ
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          আপনার এনরোল করা সকল কোর্সের তালিকা
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "active"
              ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          সক্রিয় ({active.length})
        </button>
        <button
          onClick={() => setTab("expired")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "expired"
              ? "border-red-500 text-red-600 dark:text-red-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          মেয়াদ উত্তীর্ণ ({expired.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500 mb-4">
            {tab === "active"
              ? "কোনো সক্রিয় কোর্স নেই"
              : "কোনো মেয়াদ উত্তীর্ণ কোর্স নেই"}
          </p>
          {tab === "active" && (
            <Link
              href="/courses"
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition font-medium inline-block"
            >
              কোর্স দেখুন
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((enrollment) => (
            <div
              key={enrollment._id}
              className={`rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-md transition ${
                tab === "expired"
                  ? "border-red-200 dark:border-red-800 opacity-75"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <Link href={`/courses/${enrollment.course._id}`} className="block">
                <div className="aspect-video bg-gradient-to-br from-zinc-700 to-zinc-700 flex items-center justify-center">
                  {enrollment.course.thumbnail ? (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white/80 font-bold">
                      {enrollment.course.title.charAt(0)}
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                  {enrollment.course.title}
                </h3>

                {tab === "active" && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>অগ্রগতি</span>
                      <span>
                        {enrollment.progress.watched}/{enrollment.progress.total} লেকচার
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-[#D97757] transition-all"
                        style={{ width: `${enrollment.progress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-xs text-zinc-500 mb-3">
                  <p>
                    এনরোল করা:{" "}
                    {new Date(enrollment.enrolledAt).toLocaleDateString("bn-BD")}
                  </p>
                  <p>
                    মেয়াদ:{" "}
                    {new Date(enrollment.expiryAt).toLocaleDateString("bn-BD")}
                  </p>
                  {tab === "active" ? (
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {daysLeft(enrollment.expiryAt)} দিন বাকি
                    </p>
                  ) : (
                    <p className="text-red-500 font-medium">মেয়াদ উত্তীর্ণ</p>
                  )}
                </div>

                {tab === "active" ? (
                  <Link
                    href={`/courses/${enrollment.course._id}/learn`}
                    className="block text-center w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition"
                  >
                    ▶ চালিয়ে যান
                  </Link>
                ) : (
                  <Link
                    href={`/courses/${enrollment.course._id}`}
                    className="block text-center w-full py-2 bg-[#D97757] hover:opacity-90 text-white rounded-lg text-sm font-medium transition"
                  >
                    পুনরায় এনরোল করুন
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
