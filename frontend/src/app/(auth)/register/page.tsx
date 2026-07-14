"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { getFirebaseAuth, getGoogleProvider } from "@/src/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useToast } from "@/src/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useToast();
  const [step, setStep] = useState<"register" | "otp">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/auth/register", { name, email, password });
      addToast("রেজিস্ট্রেশন সফল! আপনার ইমেইলে OTP পাঠানো হয়েছে।", "success");
      setStep("otp");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "রেজিস্ট্রেশন ব্যর্থ";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/verify-otp", { email, otp });
      setAuth(res.data.user, res.data.token);
      addToast("OTP ভেরিফিকেশন সফল! ড্যাশবোর্ডে রিডিরেক্ট করা হচ্ছে।", "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "OTP ভেরিফিকেশন ব্যর্থ";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
      const user = result.user;

      if (!user.email) throw new Error("Email not available");

      const idToken = await user.getIdToken();

      const res = await api.post("/api/auth/google", { idToken });

      setAuth(res.data.user, res.data.token);
      addToast("Google দিয়ে রেজিস্ট্রেশন সফল!", "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Google লগইন ব্যর্থ";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-zinc-800 dark:text-zinc-100">
          {step === "register" ? "রেজিস্ট্রেশন করুন" : "OTP ভেরিফিকেশন"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === "register" ? (
          <>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  নাম
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                  placeholder="আপনার নাম"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  ইমেইল
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                  পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                  placeholder="কমপক্ষে ৬ অক্ষর"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
              >
                {loading ? "রেজিস্ট্রেশন হচ্ছে..." : "রেজিস্ট্রেশন করুন"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-600" />
              <span className="text-sm text-zinc-500">অথবা</span>
              <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-600" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-4 w-full py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
            >
              Google দিয়ে রেজিস্ট্রেশন করুন
            </button>

            <p className="mt-6 text-center text-sm text-zinc-500">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link
                href="/login"
                className="text-zinc-800 dark:text-zinc-500 hover:underline font-medium"
              >
                লগইন করুন
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
              {email} - এ একটি OTP পাঠানো হয়েছে
            </p>
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                OTP কোড
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-900 disabled:bg-zinc-500 text-white rounded-lg font-medium transition"
            >
              {loading ? "ভেরিফাই হচ্ছে..." : "OTP ভেরিফাই করুন"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
