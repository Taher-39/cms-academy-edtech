"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";

interface Enrollment {
  _id: string;
  student?: { name: string; email: string };
  course?: { title: string };
  paidAmount: number;
  discountApplied: number;
  couponCode?: string;
  transactionId?: string;
  paymentStatus: "paid" | "refunded";
  enrolledAt: string;
  expiryAt: string;
}

function RefundDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (remarks: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(remarks || "Admin initiated refund");
    } finally {
      setLoading(false);
      setRemarks("");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-center mb-2 text-zinc-800 dark:text-zinc-100">
          রিফান্ড নিশ্চিত করুন
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-4">
          এই পেমেন্ট রিফান্ড করা হবে এবং শিক্ষার্থীর কোর্স অ্যাক্সেস বাতিল হয়ে যাবে।
        </p>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="রিফান্ডের কারণ (ঐচ্ছিক)"
          rows={3}
          className="w-full mb-4 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
          >
            বাতিল
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition"
          >
            {loading ? "প্রসেসিং..." : "রিফান্ড করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { user } = useAuthStore();

  if (user?.role === "student") return <StudentBillingView />;
  return <AdminPaymentsView />;
}

function StudentBillingView() {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuthStore();
  const { addToast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push(loginUrlWithRedirect(pathname));
      return;
    }
    (async () => {
      try {
        const res = await api.get("/api/enrollments");
        setEnrollments(res.data.enrollments || []);
      } catch {
        addToast("পেমেন্ট তথ্য লোড করা যায়নি", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          💳 পেমেন্ট ও বিলিং হিস্টোরি
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          আপনার সকল কোর্স পেমেন্টের তথ্য
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো পেমেন্ট তথ্য নেই</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enr) => (
            <div
              key={enr._id}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {enr.course?.title || "N/A"}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    এনরোল করা: {new Date(enr.enrolledAt).toLocaleDateString("bn-BD")} · মেয়াদ:{" "}
                    {new Date(enr.expiryAt).toLocaleDateString("bn-BD")}
                  </p>
                  {enr.transactionId && (
                    <p className="text-xs text-zinc-400 font-mono mt-1">
                      ট্রানজেকশন: {enr.transactionId}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-zinc-800 dark:text-zinc-100">
                    ৳{enr.paidAmount || 0}
                  </p>
                  {enr.discountApplied > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ছাড়: ৳{enr.discountApplied} {enr.couponCode ? `(${enr.couponCode})` : ""}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      enr.paymentStatus === "refunded"
                        ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                        : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                    }`}
                  >
                    {enr.paymentStatus === "refunded" ? "রিফান্ডেড" : "পরিশোধিত"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPaymentsView() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [refundTarget, setRefundTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!token || (user?.role !== "admin" && user?.role !== "superAdmin")) {
      addToast("অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchPayments();
  }, [token, user, router, statusFilter]);

  const fetchPayments = async () => {
    try {
      const res = await api.get("/api/enrollments/admin/all", {
        params: statusFilter ? { paymentStatus: statusFilter } : {},
      });
      setEnrollments(res.data.enrollments || []);
    } catch {
      addToast("পেমেন্ট তথ্য লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (remarks: string) => {
    if (!refundTarget) return;
    try {
      await api.post(`/api/enrollments/admin/${refundTarget}/refund`, { remarks });
      addToast("রিফান্ড সম্পন্ন হয়েছে!", "success");
      setRefundTarget(null);
      fetchPayments();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "রিফান্ড ব্যর্থ";
      addToast(msg, "error");
      setRefundTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
          >
            &larr; ড্যাশবোর্ডে ফিরুন
          </Link>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            💳 লেনদেন
          </h1>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setLoading(true);
            setStatusFilter(e.target.value);
          }}
          className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
        >
          <option value="">সব</option>
          <option value="paid">পরিশোধিত</option>
          <option value="refunded">রিফান্ডেড</option>
        </select>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো লেনদেন তথ্য নেই</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ছাত্র</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">কোর্স</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ট্রানজেকশন আইডি</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">পরিশোধ</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ছাড়</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">কুপন</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">তারিখ</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">স্ট্যাটাস</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {enrollments.map((enr) => (
                <tr key={enr._id} className="bg-white dark:bg-zinc-900">
                  <td className="px-4 py-3 text-zinc-800 dark:text-zinc-100">
                    {enr.student?.name || "N/A"}
                  </td>
                  <td className="px-4 py-3">{enr.course?.title || "N/A"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500 font-mono">
                    {enr.transactionId || "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">৳{enr.paidAmount || 0}</td>
                  <td className="px-4 py-3 text-green-600">
                    {enr.discountApplied > 0 ? `৳${enr.discountApplied}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">{enr.couponCode || "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(enr.enrolledAt).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="px-4 py-3">
                    {enr.paymentStatus === "refunded" ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                        রিফান্ডেড
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                        পরিশোধিত
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {enr.paymentStatus === "paid" && (
                      <button
                        onClick={() => setRefundTarget(enr._id)}
                        className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                      >
                        রিফান্ড
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RefundDialog
        open={!!refundTarget}
        onConfirm={handleRefund}
        onCancel={() => setRefundTarget(null)}
      />
    </div>
  );
}
