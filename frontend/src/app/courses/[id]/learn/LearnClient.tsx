"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import YouTubeEmbed from "@/src/components/YouTubeEmbed";
import QnAThread from "@/src/components/QnAThread";

interface CourseData {
  _id: string;
  title: string;
}

interface LectureData {
  _id: string;
  title: string;
  description?: string;
  chapter?: string;
  videoUrl?: string;
  noteUrl?: string;
  order: number;
  isFree: boolean;
}

interface Props {
  course: CourseData;
  lectures: LectureData[];
}

interface ChapterGroup {
  key: string;
  name: string;
  items: { lecture: LectureData; idx: number }[];
}

function groupLecturesByChapter(lectures: LectureData[]): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  const indexByKey = new Map<string, number>();
  lectures.forEach((lecture, idx) => {
    const name = lecture.chapter?.trim() || "";
    const key = name || "__uncategorized__";
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({ key, name, items: [] });
    }
    groups[indexByKey.get(key)!].items.push({ lecture, idx });
  });
  return groups;
}

export default function LearnClient({ course, lectures: initialLectures }: Props) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [lectures, setLectures] = useState(initialLectures);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [checked, setChecked] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<"video" | "qna">("video");
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [marking, setMarking] = useState(false);
  const [openChapters, setOpenChapters] = useState<Set<string>>(() => {
    const initialGroups = groupLecturesByChapter(initialLectures);
    const initialHasChapters =
      initialGroups.length > 1 || (initialGroups[0]?.name || "") !== "";
    return initialHasChapters && initialGroups.length > 0
      ? new Set([initialGroups[0].key])
      : new Set();
  });

  const chapterGroups = groupLecturesByChapter(lectures);
  const hasChapters = chapterGroups.length > 1 || (chapterGroups[0]?.name || "") !== "";

  // If the active lecture (e.g. after resuming progress) lands in a chapter
  // that isn't open yet, expand it so the lecture is visible.
  useEffect(() => {
    if (!hasChapters) return;
    const activeGroup = chapterGroups.find((g) =>
      g.items.some((it) => it.idx === activeIndex)
    );
    if (activeGroup && !openChapters.has(activeGroup.key)) {
      setOpenChapters((prev) => new Set(prev).add(activeGroup.key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, lectures]);

  const toggleChapter = (key: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setChecked(true);
        return;
      }
      try {
        const [accessRes, lectRes, enrollRes] = await Promise.all([
          api.get(`/api/enrollments/${course._id}/access`),
          api.get(`/api/courses/${course._id}/lectures`),
          api.get(`/api/enrollments`),
        ]);
        setIsEnrolled(!!accessRes.data.hasAccess);
        setLectures(lectRes.data.lectures);

        const mine = (enrollRes.data.enrollments || []).find(
          (e: any) => e.course?._id === course._id
        );
        if (mine) {
          setWatched(new Set(mine.watchedLectures || []));
          setIsExpired(new Date(mine.expiryAt) < new Date());
        }
      } catch {
        // not enrolled — free lectures only
      } finally {
        setChecked(true);
      }
    };
    load();
  }, [token, course._id]);

  const active = lectures[activeIndex];

  // এনরোল্ড শিক্ষার্থীর জন্য ধারাবাহিক আনলক: প্রথম লেকচার সবসময় খোলা, পরেরটি
  // খুলবে আগেরটি দেখা বা স্কিপ করা হলেই। এনরোল না করা দর্শকের ফ্রি প্রিভিউ
  // লেকচারগুলোতে এই ধারাবাহিকতার নিয়ম প্রযোজ্য নয় (তারা progress ট্র্যাক করতে পারে না)।
  const hasBaseAccess = (l: LectureData) => l.isFree || isEnrolled;
  const canWatch = (l: LectureData, idx: number) => {
    if (!hasBaseAccess(l)) return false;
    if (!isEnrolled) return true;
    if (idx === 0) return true;
    const prev = lectures[idx - 1];
    return watched.has(prev._id);
  };

  const markProgress = async (successMsg: string) => {
    if (!active || !isEnrolled) return;
    setMarking(true);
    try {
      await api.post(`/api/enrollments/${course._id}/progress`, {
        lectureId: active._id,
      });
      setWatched((prev) => new Set(prev).add(active._id));
      addToast(successMsg, "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "চিহ্নিত করা ব্যর্থ";
      addToast(msg, "error");
    } finally {
      setMarking(false);
    }
  };

  const handleMarkWatched = () => markProgress("লেকচারটি সম্পন্ন হিসেবে চিহ্নিত হয়েছে");
  const handleSkip = () => markProgress("লেকচারটি স্কিপ করা হয়েছে");

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-zinc-500 mb-4">এই কোর্স দেখতে লগইন করুন</p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition"
        >
          লগইন করুন
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link
            href={`/courses/${course._id}`}
            className="text-sm text-zinc-500 hover:underline"
          >
            &larr; কোর্স বিস্তারিত
          </Link>
          <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">
            {course.title}
          </h1>
        </div>
        {isExpired && (
          <span className="text-xs px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium">
            মেয়াদ উত্তীর্ণ — শুধু ফ্রি লেকচার দেখা যাবে
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar: chapters */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 font-semibold text-sm text-zinc-700 dark:text-zinc-300">
              চ্যাপ্টারসমূহ ({lectures.length})
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {hasChapters
                ? chapterGroups.map((group) => {
                    const isOpen = openChapters.has(group.key);
                    return (
                      <div key={group.key} className="border-b border-zinc-100 dark:border-zinc-800">
                        <button
                          onClick={() => toggleChapter(group.key)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                        >
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                            {group.name || "অন্যান্য লেকচার"}
                          </span>
                          <span className="flex items-center gap-2 text-xs text-zinc-500">
                            {group.items.length}
                            <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                              ▾
                            </span>
                          </span>
                        </button>
                        {isOpen && (
                          <div>
                            {group.items.map(({ lecture: l, idx }) => {
                              const unlocked = canWatch(l, idx);
                              const isActive = idx === activeIndex;
                              return (
                                <button
                                  key={l._id}
                                  onClick={() => {
                                    setActiveIndex(idx);
                                    setTab("video");
                                  }}
                                  className={`w-full text-left pl-6 pr-4 py-2.5 flex items-start gap-2 border-t border-zinc-100 dark:border-zinc-800 transition ${
                                    isActive
                                      ? "bg-zinc-100 dark:bg-zinc-800"
                                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                  }`}
                                >
                                  <span className="mt-0.5 text-xs">
                                    {watched.has(l._id) ? "✅" : unlocked ? "▶️" : "🔒"}
                                  </span>
                                  <span className="flex-1 min-w-0">
                                    <span className="block text-sm text-zinc-800 dark:text-zinc-100 truncate">
                                      {idx + 1}. {l.title}
                                    </span>
                                    {l.isFree && (
                                      <span className="text-[10px] text-green-600 dark:text-green-400">
                                        ফ্রি
                                      </span>
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                : lectures.map((l, idx) => {
                    const unlocked = canWatch(l, idx);
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={l._id}
                        onClick={() => {
                          setActiveIndex(idx);
                          setTab("video");
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-2 border-b border-zinc-100 dark:border-zinc-800 transition ${
                          isActive
                            ? "bg-zinc-100 dark:bg-zinc-800"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <span className="mt-0.5 text-xs">
                          {watched.has(l._id) ? "✅" : unlocked ? "▶️" : "🔒"}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-zinc-800 dark:text-zinc-100 truncate">
                            {idx + 1}. {l.title}
                          </span>
                          {l.isFree && (
                            <span className="text-[10px] text-green-600 dark:text-green-400">
                              ফ্রি
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
              {lectures.length === 0 && (
                <p className="px-4 py-6 text-sm text-zinc-500">কোনো লেকচার নেই</p>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {!active ? (
            <div className="p-10 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
              কোনো লেকচার পাওয়া যায়নি
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setTab("video")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    tab === "video"
                      ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                      : "border-transparent text-zinc-500"
                  }`}
                >
                  🎬 ভিডিও
                </button>
                <button
                  onClick={() => setTab("qna")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    tab === "qna"
                      ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                      : "border-transparent text-zinc-500"
                  }`}
                >
                  💬 প্রশ্ন-উত্তর
                </button>
              </div>

              {tab === "video" ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                    {active.title}
                  </h2>
                  {active.description && (
                    <p className="text-sm text-zinc-500">{active.description}</p>
                  )}

                  {canWatch(active, activeIndex) ? (
                    <>
                      {active.videoUrl ? (
                        <YouTubeEmbed url={active.videoUrl} title={active.title} />
                      ) : (
                        <div className="aspect-video flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 text-sm">
                          ভিডিও যুক্ত করা হয়নি
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {active.noteUrl && (
                          <a
                            href={active.noteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition"
                          >
                            📄 নোট ডাউনলোড করুন
                          </a>
                        )}
                        {isEnrolled && (
                          <>
                            <button
                              onClick={handleMarkWatched}
                              disabled={marking || watched.has(active._id)}
                              className="text-sm px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-lg transition"
                            >
                              {watched.has(active._id)
                                ? "✅ সম্পন্ন হয়েছে"
                                : marking
                                ? "..."
                                : "সম্পন্ন হিসেবে চিহ্নিত করুন"}
                            </button>
                            {!watched.has(active._id) && (
                              <button
                                onClick={handleSkip}
                                disabled={marking}
                                className="text-sm px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                              >
                                এড়িয়ে যান (Skip)
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  ) : hasBaseAccess(active) ? (
                    <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <p className="text-zinc-500 mb-4">
                        🔒 এই লেকচারটি খুলতে আগের লেকচারটি দেখুন অথবা স্কিপ করুন
                      </p>
                      <button
                        onClick={() => setActiveIndex(activeIndex - 1)}
                        className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition inline-block"
                      >
                        আগের লেকচারে যান
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <p className="text-zinc-500 mb-4">
                        এই লেকচারটি দেখতে কোর্সে এনরোল করুন
                      </p>
                      <Link
                        href={`/courses/${course._id}`}
                        className="px-6 py-2.5 bg-[#D97757] hover:opacity-90 text-white rounded-lg font-medium transition inline-block"
                      >
                        এনরোল করুন
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {isEnrolled && !isExpired ? (
                    <QnAThread courseId={course._id} />
                  ) : (
                    <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-sm">
                      {isExpired
                        ? "কোর্সের মেয়াদ শেষ হয়ে যাওয়ায় প্রশ্ন-উত্তর সুবিধা বন্ধ"
                        : "প্রশ্ন করতে এই কোর্সে এনরোল করুন"}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
