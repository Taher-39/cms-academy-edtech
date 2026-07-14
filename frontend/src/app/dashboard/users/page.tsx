"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import DeleteConfirmDialog from "@/src/components/DeleteConfirmDialog";

interface AppUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  phone?: string;
  enrolledCourses?: string[];
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!token || (user?.role !== "admin" && user?.role !== "superAdmin")) {
      addToast("অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [token, user, router]);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/auth/users");
      setUsers(res.data.users || []);
    } catch {
      addToast("ব্যবহারকারী তথ্য লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/auth/users/${deleteTarget}`);
      addToast("ব্যবহারকারী মুছে ফেলা হয়েছে!", "success");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/api/auth/users/${userId}`, { role: newRole });
      addToast(`রোল পরিবর্তন করে "${newRole}" করা হয়েছে!`, "success");
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "রোল পরিবর্তন ব্যর্থ";
      addToast(msg, "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    student: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    teacher: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    admin: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    superAdmin: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
        >
          &larr; ড্যাশবোর্ডে ফিরুন
        </Link>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          👥 ব্যবহারকারী ব্যবস্থাপনা
        </h1>
        <p className="text-sm text-zinc-500 mt-1">সকল ব্যবহারকারীর তালিকা ও রোল ব্যবস্থাপনা</p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো ব্যবহারকারী নেই</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">নাম</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ইমেইল</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">রোল</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">স্ট্যাটাস</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">জয়েন</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {users.map((u) => (
                <tr key={u._id} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900/40 flex items-center justify-center text-sm font-medium text-zinc-900 dark:text-zinc-400">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {user?.role !== "superAdmin" && (u.role === "admin" || u.role === "superAdmin") ? (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[u.role] || "bg-zinc-100 text-zinc-600"}`}
                        title="শুধুমাত্র সুপার অ্যাডমিন এই রোল পরিবর্তন করতে পারবেন"
                      >
                        🔒 {u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${roleColors[u.role] || "bg-zinc-100 text-zinc-600"}`}
                      >
                        <option value="student">student</option>
                        <option value="teacher">teacher</option>
                        {user?.role === "superAdmin" && <option value="admin">admin</option>}
                        {user?.role === "superAdmin" && <option value="superAdmin">superAdmin</option>}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.isVerified ? (
                      <span className="text-green-600 font-medium">ভেরিফাইড</span>
                    ) : (
                      <span className="text-red-500">আনভেরিফাইড</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="px-4 py-3">
                    {u._id !== user?._id &&
                      (user?.role === "superAdmin" ||
                        (u.role !== "admin" && u.role !== "superAdmin")) && (
                        <button
                          onClick={() => setDeleteTarget(u._id)}
                          className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                        >
                          ডিলিট
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title="ব্যবহারকারী মুছে ফেলুন"
        message="আপনি কি নিশ্চিত? এই ব্যবহারকারীকে স্থায়ীভাবে মুছে ফেলা হবে।"
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
