"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import DeleteConfirmDialog from "@/src/components/DeleteConfirmDialog";

interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

const emptyForm = { name: "", description: "" };

export default function CategoriesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
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
    fetchCategories();
  }, [token, user, router]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data.categories || []);
    } catch {
      addToast("ক্যাটাগরি তালিকা লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description || "" });
    setEditingId(category._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/categories/${editingId}`, formData);
        addToast("ক্যাটাগরি আপডেট করা হয়েছে!", "success");
      } else {
        await api.post("/api/categories", formData);
        addToast("ক্যাটাগরি তৈরি করা হয়েছে!", "success");
      }
      resetForm();
      fetchCategories();
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
      await api.delete(`/api/categories/${deleteTarget}`);
      addToast("ক্যাটাগরি মুছে ফেলা হয়েছে!", "success");
      setDeleteTarget(null);
      fetchCategories();
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
          >
            &larr; ড্যাশবোর্ডে ফিরুন
          </Link>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            📁 বিষয়/ক্যাটাগরি ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            যেকোনো সময় নতুন বিষয় (গণিত, আইসিটি, বিজ্ঞান, টেক বা অন্য কিছু) যোগ করুন — কোর্স তৈরির সময় এখান থেকেই বিষয় বেছে নেওয়া যাবে।
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm transition flex-shrink-0"
        >
          + নতুন বিষয়
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
            {editingId ? "বিষয় এডিট করুন" : "নতুন বিষয় তৈরি করুন"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                নাম *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="যেমন: টেক, গণিত, আইসিটি, বিজ্ঞান"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                বিবরণ (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
              >
                {saving ? "সেভ হচ্ছে..." : editingId ? "আপডেট করুন" : "তৈরি করুন"}
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

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো বিষয় নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c._id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
                {c.description && (
                  <p className="text-xs text-zinc-500 truncate">{c.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title="বিষয় মুছে ফেলুন"
        message="আপনি কি নিশ্চিত? এই বিষয়টি স্থায়ীভাবে মুছে যাবে।"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
