"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import StarRating from "@/src/components/StarRating";

interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  isHidden?: boolean;
  createdAt: string;
  student?: { _id: string; name: string };
}

interface Summary {
  average: number;
  count: number;
  breakdown: Record<string, number>;
}

export default function CourseReviews({ courseId }: { courseId: string }) {
  const { user, token } = useAuthStore();
  const { addToast } = useToast();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<Summary>({
    average: 0,
    count: 0,
    breakdown: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  });
  const [myReview, setMyReview] = useState<ReviewItem | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/reviews/course/${courseId}`);
      setReviews(res.data.reviews || []);
      setSummary(res.data.summary);
      setMyReview(res.data.myReview || null);
      if (res.data.myReview) {
        setRating(res.data.myReview.rating);
        setComment(res.data.myReview.comment);
      }
    } catch {
      // Reviews are non-critical for the page — fail quietly.
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) {
      setCanReview(false);
      return;
    }
    api
      .get(`/api/reviews/course/${courseId}/eligibility`)
      .then((res) => setCanReview(!!res.data.canReview))
      .catch(() => setCanReview(false));
  }, [token, courseId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/api/reviews/course/${courseId}`, { rating, comment });
      addToast(res.data.message, "success");
      setFormOpen(false);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "রিভিউ জমা দেওয়া যায়নি";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const removeMine = async () => {
    if (!myReview) return;
    try {
      await api.delete(`/api/reviews/${myReview._id}`);
      addToast("রিভিউ মুছে ফেলা হয়েছে", "success");
      setMyReview(null);
      setComment("");
      setRating(5);
      await load();
    } catch {
      addToast("রিভিউ মোছা যায়নি", "error");
    }
  };

  return (
    <div id="reviews">
      <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
        শিক্ষার্থীদের রিভিউ
      </h2>

      <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center mb-6 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="text-center">
          <p className="text-4xl font-bold text-zinc-800 dark:text-zinc-100">
            {summary.average.toFixed(1)}
          </p>
          <StarRating rating={summary.average} size="md" />
          <p className="text-xs text-zinc-500 mt-1">
            {summary.count.toLocaleString("bn-BD")} টি রিভিউ
          </p>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.breakdown?.[String(star)] || 0;
            const percent = summary.count > 0 ? (count / summary.count) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="w-8">{star} ★</span>
                <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {user && canReview && (
        <div className="mb-6">
          {!formOpen ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setFormOpen(true)}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-medium transition"
              >
                {myReview ? "রিভিউ সম্পাদনা করুন" : "রিভিউ লিখুন"}
              </button>
              {myReview && (
                <button
                  onClick={removeMine}
                  className="px-4 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  আমার রিভিউ মুছুন
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">আপনার রেটিং</span>
                <StarRating rating={rating} size="lg" editable onChange={setRating} />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                minLength={3}
                maxLength={1000}
                rows={4}
                placeholder="কোর্সটি সম্পর্কে আপনার অভিজ্ঞতা লিখুন..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-medium transition disabled:opacity-60"
                >
                  {submitting ? "জমা হচ্ছে..." : "জমা দিন"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="text-sm text-zinc-500 hover:underline"
                >
                  বাতিল
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {user && !canReview && (
        <p className="text-sm text-zinc-500 mb-6">
          এই কোর্সে এনরোল করার পর আপনি রিভিউ দিতে পারবেন।
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-zinc-500 text-sm">এখনো কোনো রিভিউ নেই — প্রথম রিভিউটি আপনিই দিন।</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {review.student?.name?.charAt(0) || "?"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {review.student?.name || "শিক্ষার্থী"}
                    </p>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(review.createdAt).toLocaleDateString("bn-BD")}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                {review.comment}
              </p>
              {review.isHidden && (
                <p className="text-xs text-red-500 mt-2">এই রিভিউটি লুকানো আছে (শুধু এডমিন দেখছেন)</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
