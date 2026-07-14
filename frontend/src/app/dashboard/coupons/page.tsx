"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import DeleteConfirmDialog from "@/src/components/DeleteConfirmDialog";

interface Coupon {
  _id: string;
  code: string;
  type: "flat" | "percent";
  discountAmount: number;
  validTill: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  code: "",
  type: "flat" as "flat" | "percent",
  discountAmount: 0,
  validTill: "",
  usageLimit: 100,
  isActive: true,
};

export default function CouponsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || (user?.role !== "admin" && user?.role !== "superAdmin")) {
      addToast("অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchCoupons();
  }, [token, user, router]);

  const fetchCoupons = async () => {
    try {
      const res = await api.get("/api/coupons");
      setCoupons(res.data.coupons || []);
    } catch {
      addToast("কুপন তালিকা লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "discountAmount" || name === "usageLimit"
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      discountAmount: coupon.discountAmount,
      validTill: coupon.validTill.slice(0, 10),
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive,
    });
    setEditingId(coupon._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/coupons/${editingId}`, formData);
        addToast("কুপন আপডেট করা হয়েছে!", "success");
      } else {
        await api.post("/api/coupons", formData);
        addToast("কুপন তৈরি করা হয়েছে!", "success");
      }
      resetForm();
      fetchCoupons();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/coupons/${deleteTarget}`);
      addToast("কুপন মুছে ফেলা হয়েছে!", "success");
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "মুছে ফেলা ব্যর্থ";
      addToast(msg, "error");
      setDeleteTarget(null);
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
          >
            &larr; ড্যাশবোর্ডে ফিরুন
          </Link>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            🎟️ কুপন ব্যবস্থাপনা
          </h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm transition"
        >
          + নতুন কুপন
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
            {editingId ? "কুপন এডিট করুন" : "নতুন কুপন তৈরি করুন"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  কুপন কোড *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="যেমন: SAVE100"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  ধরন *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                >
                  <option value="flat">ফ্ল্যাট (৳)</option>
                  <option value="percent">পার্সেন্ট (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  ছাড়ের পরিমাণ *
                </label>
                <input
                  type="number"
                  name="discountAmount"
                  value={formData.discountAmount}
                  onChange={handleInputChange}
                  min={0}
                  max={formData.type === "percent" ? 100 : undefined}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  ব্যবহারসীমা *
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  min={1}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  মেয়াদ শেষ *
                </label>
                <input
                  type="date"
                  name="validTill"
                  value={formData.validTill}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <label className="text-sm text-zinc-700 dark:text-zinc-300">সক্রিয়</label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
              >
                {saving ? "সেভ হচ্ছে..." : editingId ? "আপডেট করুন" : "কুপন তৈরি করুন"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো কুপন নেই</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">কোড</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ছাড়</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ব্যবহার</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">মেয়াদ</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">স্ট্যাটাস</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {coupons.map((c) => {
                const expired = new Date(c.validTill) < new Date();
                return (
                  <tr key={c._id} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-800 dark:text-zinc-100">
                      {c.code}
                    </td>
                    <td className="px-4 py-3">
                      {c.type === "flat" ? `৳${c.discountAmount}` : `${c.discountAmount}%`}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {c.usedCount} / {c.usageLimit}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(c.validTill).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3">
                      {!c.isActive ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          নিষ্ক্রিয়
                        </span>
                      ) : expired ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                          মেয়াদোত্তীর্ণ
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                          সক্রিয়
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-xs px-3 py-1 bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400 rounded-lg hover:bg-zinc-300 dark:hover:bg-blue-900/60 transition"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c._id)}
                        className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                      >
                        ডিলিট
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title="কুপন মুছে ফেলুন"
        message="আপনি কি নিশ্চিত? এই কুপন স্থায়ীভাবে মুছে যাবে।"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
