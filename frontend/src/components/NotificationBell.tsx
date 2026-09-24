"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const TYPE_ICONS: Record<string, string> = {
  enrollment: "🎓",
  payment: "💳",
  qna: "💬",
  live: "📺",
  session: "🧑‍🏫",
  course: "📚",
  certificate: "🏅",
  review: "⭐",
  system: "🔔",
};

export function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "এইমাত্র";
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} দিন আগে`;
  return new Date(date).toLocaleDateString("bn-BD");
}

const POLL_INTERVAL_MS = 60000;

export default function NotificationBell() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/api/notifications/unread-count");
      setUnread(res.data.unreadCount || 0);
    } catch {
      // Ignore — the bell should never break the header.
    }
  }, [token]);

  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadCount]);

  useEffect(() => {
    if (!open) return;
    api
      .get("/api/notifications", { params: { limit: 8 } })
      .then((res) => setItems(res.data.notifications || []))
      .catch(() => setItems([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!token) return null;

  const openItem = async (item: NotificationItem) => {
    setOpen(false);
    if (!item.isRead) {
      setUnread((c) => Math.max(0, c - 1));
      api.post(`/api/notifications/${item._id}/read`).catch(() => {});
    }
    if (item.link) router.push(item.link);
  };

  const markAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="নোটিফিকেশন"
        className="relative p-2 text-zinc-700 dark:text-zinc-300 hover:text-primary dark:hover:text-accent-light transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              নোটিফিকেশন
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                সব পড়া হয়েছে
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500 text-center">কোনো নোটিফিকেশন নেই</p>
            ) : (
              items.map((item) => (
                <button
                  key={item._id}
                  onClick={() => openItem(item)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition ${
                    item.isRead ? "" : "bg-accent/5"
                  }`}
                >
                  <span className="text-lg leading-none">{TYPE_ICONS[item.type] || "🔔"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                      {item.title}
                    </span>
                    <span className="block text-xs text-zinc-500 line-clamp-2">{item.message}</span>
                    <span className="block text-[11px] text-zinc-400 mt-0.5">
                      {timeAgo(item.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-sm text-accent hover:underline border-t border-zinc-200 dark:border-zinc-700"
          >
            সব নোটিফিকেশন দেখুন
          </Link>
        </div>
      )}
    </div>
  );
}
