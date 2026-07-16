"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import { loginUrlWithRedirect } from "@/src/lib/authRedirect";

interface SessionPerson {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface SessionItem {
  _id: string;
  student: SessionPerson;
  teacher: SessionPerson;
  subject: string;
  chapter?: string;
  series?: string;
  topics: string;
  requestedSchedule: string;
  durationHours: number;
  pricePerHour: number;
  amount: number;
  status: "awaiting_teacher" | "accepted" | "declined" | "cancelled" | "completed";
  meetLink?: string;
  teacherNote?: string;
  paymentMethod?: string;
  phoneNumber?: string;
  paymentStatus?: string;
  createdAt: string;
}

const STATUS_LABEL: Record<SessionItem["status"], string> = {
  awaiting_teacher: "শিক্ষকের সাড়ার অপেক্ষায়",
  accepted: "নিশ্চিত হয়েছে",
  declined: "প্রত্যাখ্যাত",
  cancelled: "বাতিল হয়েছে",
  completed: "সম্পন্ন হয়েছে",
};

const STATUS_COLOR: Record<SessionItem["status"], string> = {
  awaiting_teacher: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  accepted: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  declined: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  cancelled: "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300",
  completed: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
};

function fmtSchedule(iso: string) {
  return new Date(iso).toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }: { status: SessionItem["status"] }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function SessionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [acceptFormId, setAcceptFormId] = useState<string | null>(null);
  const [meetLinkInput, setMeetLinkInput] = useState("");
  const [declineFormId, setDeclineFormId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  useEffect(() => {
    if (!token) {
      router.push(loginUrlWithRedirect(pathname));
      return;
    }
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") addToast("পেমেন্ট সফল হয়েছে — সেশন বুক করা হয়েছে", "success");
    else if (payment === "failed") addToast("পেমেন্ট ব্যর্থ হয়েছে", "error");
    else if (payment === "cancelled") addToast("পেমেন্ট বাতিল করা হয়েছে", "info");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/api/sessions/mine");
      setSessions(res.data.sessions || []);
    } catch {
      addToast("সেশন তথ্য লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    if (!meetLinkInput.trim()) {
      addToast("মিট লিংক দিন", "error");
      return;
    }
    setActioningId(id);
    try {
      await api.post(`/api/sessions/${id}/accept`, { meetLink: meetLinkInput.trim() });
      addToast("সেশন গ্রহণ করা হয়েছে", "success");
      setAcceptFormId(null);
      setMeetLinkInput("");
      fetchSessions();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActioningId(id);
    try {
      await api.post(`/api/sessions/${id}/decline`, { note: declineNote.trim() || undefined });
      addToast("সেশন প্রত্যাখ্যান করা হয়েছে", "success");
      setDeclineFormId(null);
      setDeclineNote("");
      fetchSessions();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActioningId(id);
    try {
      await api.post(`/api/sessions/${id}/cancel`);
      addToast("সেশন বাতিল করা হয়েছে", "success");
      fetchSessions();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActioningId(id);
    try {
      await api.post(`/api/sessions/${id}/complete`);
      addToast("সেশন সম্পন্ন হিসেবে চিহ্নিত হয়েছে", "success");
      fetchSessions();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "ব্যর্থ হয়েছে";
      addToast(msg, "error");
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  const isTeacher = user?.role === "teacher";
  const isAdmin = user?.role === "admin" || user?.role === "superAdmin";
  const isStudent = user?.role === "student";

  const pending = sessions.filter((s) => s.status === "awaiting_teacher");
  const others = sessions.filter((s) => s.status !== "awaiting_teacher");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">🧑‍🏫 ওয়ান-টু-ওয়ান সেশন</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isTeacher ? "আপনার কাছে আসা সেশন রিকোয়েস্ট" : isAdmin ? "সকল সেশন (ওভারভিউ)" : "আপনার বুক করা সেশনসমূহ"}
          </p>
        </div>
        {isStudent && (
          <Link
            href="/dashboard/sessions/book"
            className="px-4 py-2 bg-[#D97757] hover:opacity-90 text-white rounded-lg text-sm font-medium transition"
          >
            + নতুন সেশন বুক করুন
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500">কোনো সেশন নেই</p>
        </div>
      ) : isAdmin ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">শিক্ষার্থী</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">শিক্ষক</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">বিষয়</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">সময়সূচী</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ফি</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {sessions.map((s) => (
                <tr key={s._id} className="bg-white dark:bg-zinc-900">
                  <td className="px-4 py-3 text-zinc-800 dark:text-zinc-100">{s.student?.name || "N/A"}</td>
                  <td className="px-4 py-3 text-zinc-800 dark:text-zinc-100">{s.teacher?.name || "N/A"}</td>
                  <td className="px-4 py-3">{s.subject}</td>
                  <td className="px-4 py-3 text-zinc-500">{fmtSchedule(s.requestedSchedule)}</td>
                  <td className="px-4 py-3 font-medium">৳{s.amount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {isTeacher && pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                নতুন রিকোয়েস্ট ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((s) => (
                  <div
                    key={s._id}
                    className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                          {s.student?.name} · {s.subject}
                        </p>
                        {(s.chapter || s.series) && (
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {s.chapter && `📖 ${s.chapter}`}{s.chapter && s.series && " · "}{s.series && `📺 ${s.series}`}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">{s.topics}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          🕒 {fmtSchedule(s.requestedSchedule)} · {s.durationHours} ঘণ্টা · ৳{s.amount}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>

                    {acceptFormId === s._id ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          type="url"
                          value={meetLinkInput}
                          onChange={(e) => setMeetLinkInput(e.target.value)}
                          placeholder="মিট লিংক দিন (Google Meet/Zoom)"
                          className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                        />
                        <button
                          onClick={() => handleAccept(s._id)}
                          disabled={actioningId === s._id}
                          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition"
                        >
                          নিশ্চিত করুন
                        </button>
                        <button
                          onClick={() => {
                            setAcceptFormId(null);
                            setMeetLinkInput("");
                          }}
                          className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg transition"
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : declineFormId === s._id ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={declineNote}
                          onChange={(e) => setDeclineNote(e.target.value)}
                          placeholder="কারণ (ঐচ্ছিক)"
                          className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
                        />
                        <button
                          onClick={() => handleDecline(s._id)}
                          disabled={actioningId === s._id}
                          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition"
                        >
                          প্রত্যাখ্যান নিশ্চিত করুন
                        </button>
                        <button
                          onClick={() => {
                            setDeclineFormId(null);
                            setDeclineNote("");
                          }}
                          className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg transition"
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            setAcceptFormId(s._id);
                            setDeclineFormId(null);
                          }}
                          className="px-4 py-2 text-sm bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition"
                        >
                          গ্রহণ করুন
                        </button>
                        <button
                          onClick={() => {
                            setDeclineFormId(s._id);
                            setAcceptFormId(null);
                          }}
                          className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg transition"
                        >
                          প্রত্যাখ্যান করুন
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            {isTeacher && pending.length > 0 && (
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">অন্যান্য সেশন</h2>
            )}
            <div className="space-y-3">
              {(isTeacher ? others : sessions).map((s) => {
                const other = isTeacher ? s.student : s.teacher;
                return (
                  <div
                    key={s._id}
                    className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                          {other?.name} · {s.subject}
                        </p>
                        {(s.chapter || s.series) && (
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {s.chapter && `📖 ${s.chapter}`}{s.chapter && s.series && " · "}{s.series && `📺 ${s.series}`}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">{s.topics}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          🕒 {fmtSchedule(s.requestedSchedule)} · {s.durationHours} ঘণ্টা · ৳{s.amount}
                        </p>
                        {s.teacherNote && s.status === "declined" && (
                          <p className="text-xs text-red-500 mt-1">কারণ: {s.teacherNote}</p>
                        )}
                      </div>
                      <StatusBadge status={s.status} />
                    </div>

                    {s.status === "accepted" && s.meetLink && (
                      <div className="mt-3 flex flex-wrap gap-2 items-center">
                        <a
                          href={s.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition inline-block"
                        >
                          🔗 মিট লিংকে যোগ দিন
                        </a>
                        {isTeacher && (
                          <button
                            onClick={() => handleComplete(s._id)}
                            disabled={actioningId === s._id}
                            className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg transition"
                          >
                            সম্পন্ন হিসেবে চিহ্নিত করুন
                          </button>
                        )}
                      </div>
                    )}

                    {isStudent && s.status === "awaiting_teacher" && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleCancel(s._id)}
                          disabled={actioningId === s._id}
                          className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition"
                        >
                          বুকিং বাতিল করুন
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-500">লোড হচ্ছে...</p>
        </div>
      }
    >
      <SessionsContent />
    </Suspense>
  );
}
