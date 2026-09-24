"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/src/lib/api";
import { useToast } from "@/src/components/Toast";
import StarRating from "@/src/components/StarRating";

interface AdminReview {
  _id: string;
  rating: number;
  comment: string;
  isHidden: boolean;
  createdAt: string;
  student?: { name: string; email: string };
  course?: { _id: string; title: string };
}

const FILTERS = [
  { value: "", label: "সব" },
  { value: "false", label: "প্রকাশিত" },
  { value: "true", label: "লুকানো" },
];

export default function ReviewModerationPage() {
  const { addToast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [hidden, setHidden] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/reviews/admin/all", {
        params: { limit: 50, hidden: hidden || undefined },
      });
      setReviews(res.data.reviews || []);
    } catch {
      addToast("রিভিউ লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  }, [hidden, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const setVisibility = async (review: AdminReview) => {
    try {
      const res = await api.patch(`/api/reviews/admin/${review._id}/visibility`, {
        isHidden: !review.isHidden,
      });
      addToast(res.data.message, "success");
      await load();
    } catch {
      addToast("আপডেট করা যায়নি", "error");
    }
  };

  const remove = async (review: AdminReview) => {
    try {
      await api.delete(`/api/reviews/${review._id}`);
      addToast("রিভিউ মুছে ফেলা হয়েছে", "success");
      await load();
    } catch {
      addToast("মুছে ফেলা যায়নি", "error");
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">⭐ রিভিউ মডারেশন</h1>

      <div className="flex items-center gap-2 mb-6 text-sm">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setHidden(f.value)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              hidden === f.value
                ? "bg-accent text-white border-accent"
                : "border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      ) : reviews.length === 0 ? (
        <p className="text-zinc-500">কোনো রিভিউ নেই</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {review.student?.name || "শিক্ষার্থী"}{" "}
                    <span className="text-zinc-400 font-normal">· {review.course?.title}</span>
                  </p>
                  <StarRating rating={review.rating} />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {review.isHidden && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">
                      লুকানো
                    </span>
                  )}
                  <button onClick={() => setVisibility(review)} className="text-accent hover:underline">
                    {review.isHidden ? "প্রকাশ করুন" : "লুকান"}
                  </button>
                  <button onClick={() => remove(review)} className="text-red-500 hover:underline">
                    মুছুন
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                {review.comment}
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                {new Date(review.createdAt).toLocaleDateString("bn-BD")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
