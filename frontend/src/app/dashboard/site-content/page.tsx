"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";

interface Banner {
  image?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  order: number;
}

interface Faq {
  question: string;
  answer: string;
  order: number;
}

export default function SiteContentPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [termsContent, setTermsContent] = useState("");

  useEffect(() => {
    if (!token || user?.role !== "superAdmin") {
      addToast("অ্যাক্সেস নেই — শুধুমাত্র সুপার অ্যাডমিন", "error");
      router.push("/dashboard");
      return;
    }
    fetchSettings();
  }, [token, user, router]);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/settings");
      const settings = res.data.settings;
      setBanners(settings.banners || []);
      setFaqs(settings.faqs || []);
      setTermsContent(settings.termsContent || "");
    } catch {
      addToast("সেটিংস লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/settings", { banners, faqs, termsContent });
      addToast("সেটিংস সংরক্ষণ করা হয়েছে!", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "সংরক্ষণ ব্যর্থ";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const addBanner = () => {
    setBanners((prev) => [...prev, { image: "", title: "", subtitle: "", link: "", order: prev.length }]);
  };
  const updateBanner = (i: number, field: keyof Banner, value: string) => {
    setBanners((prev) => prev.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)));
  };
  const removeBanner = (i: number) => {
    setBanners((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addFaq = () => {
    setFaqs((prev) => [...prev, { question: "", answer: "", order: prev.length }]);
  };
  const updateFaq = (i: number, field: "question" | "answer", value: string) => {
    setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  };
  const removeFaq = (i: number) => {
    setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
        >
          &larr; ড্যাশবোর্ডে ফিরুন
        </Link>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          🖋️ সাইট কনটেন্ট
        </h1>
        <p className="text-sm text-zinc-500 mt-1">ব্যানার, FAQ এবং শর্তাবলী সম্পাদনা করুন</p>
      </div>

      {/* Banners */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">ব্যানার</h2>
          <button
            onClick={addBanner}
            className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            + ব্যানার যোগ করুন
          </button>
        </div>
        <div className="space-y-4">
          {banners.map((b, i) => (
            <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={() => removeBanner(i)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  মুছে ফেলুন
                </button>
              </div>
              <input
                type="text"
                placeholder="ছবির URL"
                value={b.image || ""}
                onChange={(e) => updateBanner(i, "image", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                placeholder="শিরোনাম"
                value={b.title || ""}
                onChange={(e) => updateBanner(i, "title", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                placeholder="সাব-টাইটেল"
                value={b.subtitle || ""}
                onChange={(e) => updateBanner(i, "subtitle", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                placeholder="লিংক"
                value={b.link || ""}
                onChange={(e) => updateBanner(i, "link", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          ))}
          {banners.length === 0 && <p className="text-sm text-zinc-500">কোনো ব্যানার নেই</p>}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">FAQ</h2>
          <button
            onClick={addFaq}
            className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            + প্রশ্ন যোগ করুন
          </button>
        </div>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={() => removeFaq(i)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  মুছে ফেলুন
                </button>
              </div>
              <input
                type="text"
                placeholder="প্রশ্ন"
                value={f.question}
                onChange={(e) => updateFaq(i, "question", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium"
              />
              <textarea
                placeholder="উত্তর"
                value={f.answer}
                onChange={(e) => updateFaq(i, "answer", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          ))}
          {faqs.length === 0 && <p className="text-sm text-zinc-500">কোনো প্রশ্ন নেই</p>}
        </div>
      </section>

      {/* Terms */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">শর্তাবলী (HTML)</h2>
        <textarea
          value={termsContent}
          onChange={(e) => setTermsContent(e.target.value)}
          rows={14}
          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
        />
      </section>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 border-t border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-6 py-3 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
        >
          {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
        </button>
      </div>
    </div>
  );
}
