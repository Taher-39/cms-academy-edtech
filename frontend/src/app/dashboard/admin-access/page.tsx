"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import DeleteConfirmDialog from "@/src/components/DeleteConfirmDialog";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Course {
  _id: string;
  title: string;
}

interface Grant {
  _id: string;
  student: { _id: string; name: string; email: string; role: string };
  course: { _id: string; title: string };
  grantedBy: { _id: string; name: string; email: string };
  createdAt: string;
  expiryAt?: string;
}

export default function AdminAccessPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [granting, setGranting] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!token || user?.role !== "superAdmin") {
      addToast("অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [token, user, router]);

  const fetchData = async () => {
    try {
      const [usersRes, coursesRes, grantsRes] = await Promise.all([
        api.get("/api/auth/users"),
        api.get("/api/courses", { params: { limit: 100 } }),
        api.get("/api/enrollments/admin/grants"),
      ]);
      setAdmins((usersRes.data.users || []).filter((u: AdminUser) => u.role === "admin"));
      setCourses(coursesRes.data.courses || []);
      setGrants(grantsRes.data.grants || []);
    } catch {
      addToast("তথ্য লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin || !selectedCourse) return;
    setGranting(true);
    try {
      await api.post("/api/enrollments/admin/grant", {
        userId: selectedAdmin,
        courseId: selectedCourse,
      });
      addToast("ফ্রি অ্যাক্সেস দেওয়া হয়েছে!", "success");
      setSelectedAdmin("");
      setSelectedCourse("");
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await api.delete(`/api/enrollments/admin/grant/${revokeTarget}`);
      addToast("অ্যাক্সেস প্রত্যাহার করা হয়েছে!", "success");
      setRevokeTarget(null);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
      setRevokeTarget(null);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
        >
          &larr; ড্যাশবোর্ডে ফিরুন
        </Link>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          🔑 এডমিন কোর্স অ্যাক্সেস
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          superAdmin-এর সকল কোর্সে ডিফল্ট অ্যাক্সেস আছে। এডমিনদের নির্দিষ্ট কোর্সে ফ্রি অ্যাক্সেস দিতে
          এখান থেকে নির্বাচন করুন।
        </p>
      </div>

      <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
          নতুন অ্যাক্সেস দিন
        </h2>
        <form onSubmit={handleGrant} className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              এডমিন
            </label>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
            >
              <option value="">-- নির্বাচন করুন --</option>
              {admins.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              কোর্স
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
            >
              <option value="">-- নির্বাচন করুন --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={granting || !selectedAdmin || !selectedCourse}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
          >
            {granting ? "দেওয়া হচ্ছে..." : "ফ্রি অ্যাক্সেস দিন"}
          </button>
        </form>
        {admins.length === 0 && (
          <p className="text-xs text-zinc-500 mt-3">
            কোনো এডমিন নেই —{" "}
            <Link href="/dashboard/users" className="underline">
              ব্যবহারকারী ব্যবস্থাপনা
            </Link>{" "}
            থেকে কাউকে এডমিন করুন।
          </p>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-3 text-zinc-800 dark:text-zinc-100">
        বর্তমান অ্যাক্সেস তালিকা
      </h2>
      {grants.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো ফ্রি অ্যাক্সেস দেওয়া হয়নি</p>
        </div>
      ) : (
        <div className="space-y-2">
          {grants.map((g) => (
            <div
              key={g._id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-800 dark:text-zinc-100">
                  {g.student?.name} <span className="text-zinc-500 font-normal">({g.student?.email})</span>
                </p>
                <p className="text-sm text-zinc-500 truncate">
                  কোর্স: {g.course?.title} · দিয়েছেন: {g.grantedBy?.name}
                </p>
              </div>
              <button
                onClick={() => setRevokeTarget(g._id)}
                className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition flex-shrink-0"
              >
                প্রত্যাহার
              </button>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!revokeTarget}
        title="অ্যাক্সেস প্রত্যাহার করুন"
        message="আপনি কি নিশ্চিত? এই এডমিনের এই কোর্সের অ্যাক্সেস মুছে যাবে।"
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
