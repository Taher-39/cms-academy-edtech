"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyLandingPage() {
  const router = useRouter();
  const [id, setId] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = id.trim().toUpperCase();
    if (trimmed) router.push(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
        সার্টিফিকেট যাচাই
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        সার্টিফিকেটের আইডি দিন (যেমন CMS-2026-4F9A2B) — আমরা সঙ্গে সঙ্গে যাচাই করে দেখাব।
      </p>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="CMS-2026-XXXXXX"
          className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-transparent text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent font-mono"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-light text-white font-semibold transition"
        >
          যাচাই করুন
        </button>
      </form>
    </div>
  );
}
