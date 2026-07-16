"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";

interface ManualPayment {
  _id: string;
  student?: { _id: string; name: string; email: string; phone?: string };
  course?: { _id: string; title: string; price: number };
  phoneNumber: string;
  paymentMethod: string;
  amount: number;
  screenshot?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  reviewedBy?: { name: string; email: string };
  reviewedAt?: string;
  enrollmentId?: string;
  createdAt: string;
}

function ReviewDialog({
  open,
  payment,
  action,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  payment: ManualPayment;
  action: "approved" | "rejected";
  onConfirm: (notes: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(notes);
    } finally {
      setLoading(false);
      setNotes("");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-center mb-2 text-zinc-800 dark:text-zinc-100">
          {action === "approved" ? "✅ পেমেন্ট এপ্রুভ করুন" : "❌ পেমেন্ট রিজেক্ট করুন"}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-1">
          {payment.student?.name} — {payment.course?.title}
        </p>
        <p className="text-sm font-medium text-center mb-4 text-zinc-800 dark:text-zinc-200">
          {payment.paymentMethod}: {payment.phoneNumber} · ৳{payment.amount}
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={action === "approved" ? "নোট (ঐচ্ছিক)" : "রিজেক্টের কারণ"}
          rows={3}
          className="w-full mb-4 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-300"
          >
            বাতিল
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 ${
              action === "approved"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "প্রসেসিং..." : action === "approved" ? "এপ্রুভ" : "রিজেক্ট"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManualPaymentsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [pendingCount, setPendingCount] = useState(0);

  // Review state
  const [reviewTarget, setReviewTarget] = useState<ManualPayment | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");

  // Screenshot lightbox
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!token || (user?.role !== "admin" && user?.role !== "superAdmin")) {
      addToast("অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchPayments();
    fetchPendingCount();
  }, [token, user, router, statusFilter]);

  const fetchPayments = async () => {
    try {
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/api/payment/manual", { params });
      setPayments(res.data.payments || []);
    } catch {
      addToast("ডেটা লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.get("/api/payment/manual/pending-count");
      setPendingCount(res.data.count || 0);
    } catch {}
  };

  const handleReview = async (notes: string) => {
    if (!reviewTarget) return;
    try {
      await api.put(`/api/payment/manual/${reviewTarget._id}/review`, {
        status: reviewAction,
        adminNotes: notes || undefined,
      });
      addToast(
        reviewAction === "approved"
          ? "পেমেন্ট এপ্রুভ করা হয়েছে! শিক্ষার্থী এনরোল্ড।"
          : "পেমেন্ট রিজেক্ট করা হয়েছে",
        reviewAction === "approved" ? "success" : "info"
      );
      setReviewTarget(null);
      fetchPayments();
      fetchPendingCount();
    } catch (err: any) {
      addToast(err.response?.data?.message || "রিভিউ ব্যর্থ", "error");
      setReviewTarget(null);
    }
  };

  const tabs = [
    { value: "pending", label: `⏳ পেন্ডিং (${pendingCount})` },
    { value: "approved", label: "✅ এপ্রুভড" },
    { value: "rejected", label: "❌ রিজেক্টেড" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            💰 ম্যানুয়াল পেমেন্ট ভেরিফিকেশন
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            bKash/Nagad/Rocket — শিক্ষার্থীদের পেমেন্ট এপ্রুভ/রিজেক্ট করুন
          </p>
        </div>
        <Link
          href="/dashboard/payments"
          className="text-sm text-blue-600 hover:underline whitespace-nowrap"
        >
          ← SSLCommerz পেমেন্ট দেখুন
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value === "pending" ? "pending" : tab.value)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === tab.value || (tab.value === "pending" && !statusFilter)
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো পেমেন্ট নেই</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment._id}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  {/* Student Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {payment.student?.name || "N/A"}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {payment.student?.email}
                    </span>
                  </div>

                  {/* Course */}
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    📚 {payment.course?.title || "N/A"}
                  </p>

                  {/* Payment Details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 mb-2">
                    <span>
                      {payment.paymentMethod}: <strong>{payment.phoneNumber}</strong>
                    </span>
                    <span>
                      টাকা: <strong>৳{payment.amount}</strong>
                    </span>
                    <span>
                      তারিখ: {new Date(payment.createdAt).toLocaleDateString("bn-BD")}
                    </span>
                  </div>

                  {/* Screenshot */}
                  {payment.screenshot && (
                    <button
                      onClick={() => setLightbox(payment.screenshot!)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      🖼️ স্ক্রিনশট দেখুন
                    </button>
                  )}

                  {/* Review Info */}
                  {payment.status !== "pending" && (
                    <div
                      className={`mt-2 text-xs px-3 py-1.5 rounded-lg inline-block ${
                        payment.status === "approved"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {payment.status === "approved" ? "✅ এপ্রুভড" : "❌ রিজেক্টেড"}
                      {payment.reviewedBy && ` — ${payment.reviewedBy.name}`}
                      {payment.reviewedAt &&
                        ` · ${new Date(payment.reviewedAt).toLocaleDateString("bn-BD")}`}
                      {payment.adminNotes && <p className="mt-1">{payment.adminNotes}</p>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {payment.status === "pending" && (
                  <div className="flex gap-2 sm:flex-col shrink-0">
                    <button
                      onClick={() => {
                        setReviewTarget(payment);
                        setReviewAction("approved");
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      ✅ এপ্রুভ
                    </button>
                    <button
                      onClick={() => {
                        setReviewTarget(payment);
                        setReviewAction("rejected");
                      }}
                      className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg text-sm font-medium transition"
                    >
                      ❌ রিজেক্ট
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <ReviewDialog
        open={!!reviewTarget}
        payment={reviewTarget!}
        action={reviewAction}
        onConfirm={handleReview}
        onCancel={() => setReviewTarget(null)}
      />

      {/* Screenshot Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Payment screenshot"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
