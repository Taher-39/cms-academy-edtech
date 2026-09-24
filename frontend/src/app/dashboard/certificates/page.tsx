"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";

interface Certificate {
  _id: string;
  certificateId: string;
  studentName: string;
  courseTitle: string;
  teacherName?: string;
  lecturesCompleted: number;
  totalLectures: number;
  issuedAt: string;
  revokedAt?: string | null;
  student?: { name: string; email: string };
  course?: { title: string };
}

export default function CertificatesPage() {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "superAdmin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        isAdmin ? "/api/certificates/admin/all" : "/api/certificates/mine"
      );
      setCertificates(res.data.certificates || []);
    } catch {
      addToast("সার্টিফিকেট লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRevoke = async (cert: Certificate) => {
    try {
      const res = await api.patch(`/api/certificates/admin/${cert._id}/revoke`, {
        revoked: !cert.revokedAt,
      });
      addToast(res.data.message, "success");
      await load();
    } catch {
      addToast("আপডেট করা যায়নি", "error");
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
        🏅 {isAdmin ? "সকল সার্টিফিকেট" : "আমার সার্টিফিকেট"}
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        কোর্সের সব লেকচার সম্পন্ন করলে সার্টিফিকেট স্বয়ংক্রিয়ভাবে ইস্যু হয়।
      </p>

      {loading ? (
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      ) : certificates.length === 0 ? (
        <p className="text-zinc-500">এখনো কোনো সার্টিফিকেট নেই।</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {cert.courseTitle || cert.course?.title}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {isAdmin ? cert.student?.name || cert.studentName : cert.studentName}
                  </p>
                </div>
                {cert.revokedAt ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">
                    বাতিল
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    বৈধ
                  </span>
                )}
              </div>

              <dl className="mt-4 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between gap-3">
                  <dt>সার্টিফিকেট আইডি</dt>
                  <dd className="font-mono text-zinc-800 dark:text-zinc-200">{cert.certificateId}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>লেকচার</dt>
                  <dd>
                    {cert.lecturesCompleted}/{cert.totalLectures}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>ইস্যু</dt>
                  <dd>{new Date(cert.issuedAt).toLocaleDateString("bn-BD")}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link
                  href={`/verify/${cert.certificateId}`}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-white transition"
                >
                  সার্টিফিকেট দেখুন
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => toggleRevoke(cert)}
                    className={
                      cert.revokedAt
                        ? "text-emerald-600 dark:text-emerald-400 hover:underline"
                        : "text-red-600 dark:text-red-400 hover:underline"
                    }
                  >
                    {cert.revokedAt ? "পুনর্বহাল করুন" : "বাতিল করুন"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
