"use client";

import { useState } from "react";
import api from "@/src/lib/api";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/api/contact", formData);
      setSuccess("আপনার বার্তা পাঠানো হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
      setFormData({ name: "", email: "", message: "" });
    } catch {
      setError("বার্তা পাঠানো ব্যর্থ। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">
        যোগাযোগ
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <h2 className="text-lg font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
              📧 ইমেইল
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              support@cmsacademy.com
            </p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <h2 className="text-lg font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
              📞 ফোন
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              ০১৫১৬৫৫৯৫১৫
            </p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <h2 className="text-lg font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
              📧 ইমেইল
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              cmsacademy25@gmail.com
            </p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <h2 className="text-lg font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
              📍 ঠিকানা
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              রাজশাহী, বাংলাদেশ
            </p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <h2 className="text-lg font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
              💬 WhatsApp
            </h2>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801516559515"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              +৮৮০ ১৫১৬ ৫৫৯৫১৫
            </a>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
            আমাদের একটি বার্তা পাঠান
          </h2>

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
              {success}
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
                নাম
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                ইমেইল
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                বার্তা
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
            >
              {loading ? "পাঠানো হচ্ছে..." : "পাঠান"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
