"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, setAuth } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      router.push(loginUrlWithRedirect(pathname));
      return;
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
  }, [token, user, router, pathname]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.put("/api/auth/me", { name, phone });
      if (token) setAuth(res.data.user, token);
      setSuccess(res.data.message || "প্রোফাইল আপডেট সফল");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "আপডেট ব্যর্থ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/api/auth/avatar", formData);
      if (token) setAuth(res.data.user, token);
      setSuccess(res.data.message || "প্রোফাইল ছবি আপলোড সফল");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "ছবি আপলোড ব্যর্থ";
      setError(msg);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("নতুন পাসওয়ার্ড মিলছে না");
      return;
    }
    if (newPassword.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
      });
      setSuccess(res.data.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">
        প্রোফাইল সেটিংস
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Profile Info */}
      <div className="mb-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
          ব্যক্তিগত তথ্য
        </h2>

        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="relative w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900/40 flex items-center justify-center text-2xl font-bold text-zinc-800 dark:text-zinc-500 overflow-hidden group flex-shrink-0"
            title="প্রোফাইল ছবি পরিবর্তন করুন"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition">
              {avatarUploading ? "..." : "✏️"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400 mt-1">
              {user.role === "student"
                ? "শিক্ষার্থী"
                : user.role === "teacher"
                ? "শিক্ষক"
                : user.role === "superAdmin"
                ? "সুপার অ্যাডমিন"
                : "অ্যাডমিন"}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              নাম
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              ফোন নম্বর
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              placeholder="+৮৮০ ১XXX XXX XXX"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
          >
            {loading ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
          পাসওয়ার্ড পরিবর্তন
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              বর্তমান পাসওয়ার্ড
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              নতুন পাসওয়ার্ড
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
              placeholder="কমপক্ষে ৬ অক্ষর"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
              নতুন পাসওয়ার্ড (আবার)
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
          >
            {loading ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}
