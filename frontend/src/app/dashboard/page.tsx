"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { addToast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      addToast("লগইন প্রয়োজন", "error");
      router.push("/login");
      return;
    }

    const fetchEnrollments = async () => {
      try {
        const res = await api.get("/api/enrollments");
        setEnrollments(res.data.enrollments);
      } catch {
        addToast("এনরোলমেন্ট তথ্য লোড করা যায়নি", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [token, router]);

  if (!user) return null;

  const isAdmin = user.role === "admin" || user.role === "superAdmin";
  const isSuperAdmin = user.role === "superAdmin";
  const isTeacher = user.role === "teacher";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            ড্যাশবোর্ড
          </h1>
          <p className="text-zinc-500 mt-1">
            স্বাগতম, {user.name}!
            {isAdmin && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                অ্যাডমিন
              </span>
            )}
            {isTeacher && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                শিক্ষক
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            addToast("লগআউট সফল", "info");
            router.push("/");
          }}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition"
        >
          লগআউট
        </button>
      </div>

      {/* Admin/Teacher quick actions */}
      {(isAdmin || isTeacher) && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
            দ্রুত কার্যক্রম
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/courses/manage"
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400 rounded-lg text-sm hover:bg-zinc-300 dark:hover:bg-blue-900/60 transition"
            >
              📚 কোর্স ম্যানেজ
            </Link>
            {isTeacher && (
              <Link
                href="/dashboard/lectures"
                className="px-4 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/60 transition"
              >
                🎬 লেকচার
              </Link>
            )}
            {isAdmin && (
              <>
                <Link
                  href="/dashboard/users"
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                >
                  👥 ব্যবহারকারী
                </Link>
                <Link
                  href="/dashboard/payments"
                  className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition"
                >
                  💳 লেনদেন
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
                >
                  📊 অ্যানালিটিক্স
                </Link>
                <Link
                  href="/dashboard/coupons"
                  className="px-4 py-2 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/60 transition"
                >
                  🎟️ কুপন
                </Link>
              </>
            )}
            {isSuperAdmin && (
              <Link
                href="/dashboard/site-content"
                className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition"
              >
                🖋️ সাইট কনটেন্ট
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard/profile"
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
        >
          ⚙️ প্রোফাইল
        </Link>
      </div>

      {/* Continue Watching */}
      {!loading &&
        (() => {
          const now = new Date();
          const continueList = enrollments
            .filter(
              (e) =>
                new Date(e.expiryAt) >= now &&
                e.progress &&
                e.progress.total > 0 &&
                e.progress.percent < 100
            )
            .sort(
              (a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
            )
            .slice(0, 3);

          if (continueList.length === 0) return null;

          return (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
                ▶ চালিয়ে যান
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {continueList.map((enrollment) => (
                  <Link
                    key={enrollment._id}
                    href={`/courses/${enrollment.course._id}/learn`}
                    className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow-md transition"
                  >
                    <h3 className="font-medium text-zinc-800 dark:text-zinc-100 mb-2 truncate">
                      {enrollment.course.title}
                    </h3>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-1">
                      <div
                        className="h-full bg-[#C89B3C]"
                        style={{ width: `${enrollment.progress.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500">
                      {enrollment.progress.watched}/{enrollment.progress.total} লেকচার সম্পন্ন
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

      {/* My Enrollments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            আমার কোর্সসমূহ
          </h2>
          {enrollments.length > 0 && (
            <Link
              href="/dashboard/my-courses"
              className="text-sm text-zinc-800 dark:text-zinc-400 hover:underline"
            >
              সব দেখুন &rarr;
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">
            লোড হচ্ছে...
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <p className="text-zinc-500 mb-4">
              আপনি এখনো কোনো কোর্সে এনরোল্ড হননি
            </p>
            <Link
              href="/courses"
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg transition font-medium"
            >
              কোর্স দেখুন
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const isExpired = new Date(enrollment.expiryAt) < new Date();
              return (
                <Link
                  key={enrollment._id}
                  href={
                    isExpired
                      ? `/courses/${enrollment.course._id}`
                      : `/courses/${enrollment.course._id}/learn`
                  }
                  className={`block rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-md transition ${
                    isExpired
                      ? "border-red-200 dark:border-red-800 opacity-60"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
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
                  <div className="p-4">
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {enrollment.course.title}
                    </h3>
                    {!isExpired && enrollment.progress && enrollment.progress.total > 0 && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-[#C89B3C]"
                            style={{ width: `${enrollment.progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="mt-2 space-y-1 text-xs text-zinc-500">
                      <p>
                        এনরোল করা:{" "}
                        {new Date(enrollment.enrolledAt).toLocaleDateString(
                          "bn-BD"
                        )}
                      </p>
                      <p>
                        মেয়াদ:{" "}
                        {new Date(enrollment.expiryAt).toLocaleDateString(
                          "bn-BD"
                        )}
                      </p>
                      {enrollment.paidAmount > 0 && (
                        <p>পরিশোধ: ৳{enrollment.paidAmount}</p>
                      )}
                      {enrollment.discountApplied > 0 && (
                        <p>ছাড়: ৳{enrollment.discountApplied}</p>
                      )}
                      {isExpired && (
                        <p className="text-red-500 font-medium">
                          মেয়াদ উত্তীর্ণ
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
