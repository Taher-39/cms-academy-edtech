"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/src/lib/api";
import { useToast } from "@/src/components/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      setMessage(res.data.message);
      addToast(res.data.message, "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "কিছু ভুল হয়েছে";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-700">
        <h1 className="text-2xl font-bold text-center mb-2 text-zinc-800 dark:text-zinc-100">
          পাসওয়ার্ড ভুলে গেছেন?
        </h1>
        <p className="text-sm text-zinc-500 text-center mb-6">
          আপনার ইমেইল দিন, আমরা একটি OTP পাঠাব
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              ইমেইল
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
          >
            {loading ? "পাঠানো হচ্ছে..." : "OTP পাঠান"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/reset-password"
            className="block text-sm text-zinc-800 dark:text-zinc-500 hover:underline"
          >
            ইতিমধ্যে OTP পেয়েছেন? পাসওয়ার্ড রিসেট করুন
          </Link>
          <Link
            href="/login"
            className="block text-sm text-zinc-500 hover:underline"
          >
            লগইনে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
