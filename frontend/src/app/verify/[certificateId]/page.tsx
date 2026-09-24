"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/src/lib/api";

interface Certificate {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  teacherName?: string;
  lecturesCompleted: number;
  totalLectures: number;
  issuedAt: string;
  revokedAt?: string | null;
}

export default function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = use(params);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/certificates/verify/${encodeURIComponent(certificateId)}`)
      .then((res) => {
        setCertificate(res.data.certificate);
        setValid(res.data.valid);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "সার্টিফিকেট যাচাই করা যায়নি");
      })
      .finally(() => setLoading(false));
  }, [certificateId]);

  if (loading) {
    return <p className="max-w-2xl mx-auto px-4 py-16 text-center text-zinc-500">যাচাই করা হচ্ছে...</p>;
  }

  if (error || !certificate) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">❌</p>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
          সার্টিফিকেট পাওয়া যায়নি
        </h1>
        <p className="text-sm text-zinc-500 mb-6">{error}</p>
        <Link href="/verify" className="text-accent hover:underline">
          আবার চেষ্টা করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div
        className={`mb-6 p-4 rounded-lg text-sm text-center ${
          valid
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        }`}
      >
        {valid
          ? "✅ এই সার্টিফিকেটটি বৈধ এবং CMS Academy কর্তৃক ইস্যুকৃত"
          : "⚠️ এই সার্টিফিকেটটি বাতিল করা হয়েছে"}
      </div>

      <div className="rounded-2xl border-4 border-double border-amber-500/70 bg-white dark:bg-zinc-900 p-10 text-center print:border-black">
        <p className="text-sm tracking-[0.3em] text-zinc-500 uppercase">CMS Academy</p>
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mt-4">
          কোর্স সম্পন্নের সার্টিফিকেট
        </h1>
        <p className="text-sm text-zinc-500 mt-6">এই মর্মে প্রত্যয়ন করা যাচ্ছে যে</p>
        <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-2">
          {certificate.studentName}
        </p>
        <p className="text-sm text-zinc-500 mt-4">সফলভাবে সম্পন্ন করেছেন</p>
        <p className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mt-2">
          {certificate.courseTitle}
        </p>
        {certificate.teacherName && (
          <p className="text-sm text-zinc-500 mt-4">শিক্ষক: {certificate.teacherName}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-zinc-500">
          <span>
            সার্টিফিকেট আইডি:{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {certificate.certificateId}
            </span>
          </span>
          <span>
            লেকচার: {certificate.lecturesCompleted}/{certificate.totalLectures}
          </span>
          <span>ইস্যু: {new Date(certificate.issuedAt).toLocaleDateString("bn-BD")}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-light text-white font-semibold transition"
        >
          প্রিন্ট / PDF সংরক্ষণ
        </button>
        <Link
          href="/verify"
          className="px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
        >
          অন্য আইডি যাচাই
        </Link>
      </div>
    </div>
  );
}
