"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { addToast } = useToast();
  const [ready, setReady] = useState(false);

  // Wait for Zustand persist to hydrate
  useEffect(() => {
    // Small delay to let Zustand rehydrate from localStorage
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.push("/login");
    }
  }, [ready, token, router]);

  if (!ready || !token || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  const isAdmin = user.role === "admin" || user.role === "superAdmin";
  const isTeacher = user.role === "teacher";

  const links = [
    { href: "/dashboard", label: "🏠 ড্যাশবোর্ড", roles: ["student", "teacher", "admin", "superAdmin"] },
    { href: "/dashboard/my-courses", label: "🎓 আমার কোর্স", roles: ["student"] },
    { href: "/dashboard/profile", label: "⚙️ প্রোফাইল", roles: ["student", "teacher", "admin", "superAdmin"] },
    { href: "/dashboard/courses/manage", label: "📚 কোর্স ম্যানেজ", roles: ["teacher", "admin", "superAdmin"] },
    { href: "/dashboard/lectures", label: "🎬 লেকচার", roles: ["teacher", "admin", "superAdmin"] },
    { href: "/dashboard/live", label: "📺 লাইভ ক্লাস", roles: ["teacher", "admin", "superAdmin"] },
    { href: "/dashboard/qna", label: "💬 Q&A", roles: ["student", "teacher", "admin", "superAdmin"] },
    { href: "/dashboard/users", label: "👥 ইউজার", roles: ["admin", "superAdmin"] },
    { href: "/dashboard/payments", label: user.role === "student" ? "💳 পেমেন্ট" : "💳 লেনদেন", roles: ["student", "admin", "superAdmin"] },
    { href: "/dashboard/analytics", label: "📊 অ্যানালিটিক্স", roles: ["admin", "superAdmin"] },
    { href: "/dashboard/coupons", label: "🎟️ কুপন", roles: ["admin", "superAdmin"] },
    { href: "/dashboard/site-content", label: "🖋️ সাইট কনটেন্ট", roles: ["superAdmin"] },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 dark:bg-zinc-950 border-r border-zinc-700 flex flex-col">
        <div className="p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-lg">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{user.name}</p>
              <p className="text-xs text-zinc-400">
                {user.role === "student"
                  ? "শিক্ষার্থী"
                  : user.role === "teacher"
                  ? "শিক্ষক"
                  : user.role === "superAdmin"
                  ? "সুপার অ্যাডমিন"
                  : "অ্যাডমিন"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="p-3 border-t border-zinc-700">
          <button
            onClick={() => {
              logout();
              addToast("লগআউট সফল", "info");
              router.push("/");
            }}
            className="w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition text-left"
          >
            🚪 লগআউট
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
