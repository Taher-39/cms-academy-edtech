"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/src/lib/api";
import { useToast } from "@/src/components/Toast";
import { TYPE_ICONS, timeAgo, type NotificationItem } from "@/src/components/NotificationBell";

export default function NotificationsPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/notifications", {
        params: { limit: 50, unread: unreadOnly ? "true" : undefined },
      });
      setItems(res.data.notifications || []);
    } catch {
      addToast("নোটিফিকেশন লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      addToast("আপডেট করা যায়নি", "error");
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      addToast("সব নোটিফিকেশন পঠিত", "success");
    } catch {
      addToast("আপডেট করা যায়নি", "error");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setItems((prev) => prev.filter((n) => n._id !== id));
    } catch {
      addToast("মুছে ফেলা যায়নি", "error");
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/api/notifications/clear");
      setItems([]);
      addToast("সব নোটিফিকেশন মুছে ফেলা হয়েছে", "success");
    } catch {
      addToast("মুছে ফেলা যায়নি", "error");
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">🔔 নোটিফিকেশন</h1>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              unreadOnly
                ? "bg-accent text-white border-accent"
                : "border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            শুধু অপঠিত
          </button>
          <button onClick={markAllRead} className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300">
            সব পড়া হয়েছে
          </button>
          <button onClick={clearAll} className="px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
            সব মুছুন
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      ) : items.length === 0 ? (
        <p className="text-zinc-500">কোনো নোটিফিকেশন নেই</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className={`p-4 rounded-xl border flex gap-3 ${
                item.isRead
                  ? "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  : "border-accent/40 bg-accent/5"
              }`}
            >
              <span className="text-xl leading-none">{TYPE_ICONS[item.type] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-800 dark:text-zinc-100">{item.title}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.message}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <span className="text-zinc-400">{timeAgo(item.createdAt)}</span>
                  {item.link && (
                    <Link
                      href={item.link}
                      onClick={() => !item.isRead && markRead(item._id)}
                      className="text-accent hover:underline"
                    >
                      দেখুন
                    </Link>
                  )}
                  {!item.isRead && (
                    <button onClick={() => markRead(item._id)} className="text-zinc-500 hover:underline">
                      পঠিত করুন
                    </button>
                  )}
                  <button onClick={() => remove(item._id)} className="text-red-500 hover:underline">
                    মুছুন
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
