"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CourseCard from "@/src/components/CourseCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "";
  const classLevel = searchParams.get("classLevel") || "";
  const type = searchParams.get("type") || "";
  const free = searchParams.get("free") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    fetchCourses();
  }, [category, classLevel, type, free, search]);

  const fetchCourses = async () => {
    setLoading(true);
    const url = new URL(`${API_URL}/api/courses`);
    if (category) url.searchParams.set("category", category);
    if (classLevel) url.searchParams.set("classLevel", classLevel);
    if (type) url.searchParams.set("type", type);
    if (free) url.searchParams.set("free", free);
    if (search) url.searchParams.set("search", search);
    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/courses?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">
        কোর্সসমূহ
      </h1>

      {/* Filters — auto-apply on select, no button */}
      <div className="mb-10 grid grid-cols-2 md:grid-cols-5 gap-4">
        <input
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateFilter("search", (e.target as HTMLInputElement).value);
          }}
          placeholder="সার্চ করুন... (Enter দিন)"
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none"
        />

        <select
          value={category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none cursor-pointer"
        >
          <option value="">সব ক্যাটাগরি</option>
          <option value="academic">একাডেমিক</option>
          <option value="job">চাকরি</option>
        </select>

        <select
          value={classLevel}
          onChange={(e) => updateFilter("classLevel", e.target.value)}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none cursor-pointer"
        >
          <option value="">সব শ্রেণী</option>
          <option value="6-8">৬ষ্ঠ-৮ম</option>
          <option value="9-10">৯ম-১০ম</option>
          <option value="11-12">১১শ-১২শ</option>
          <option value="job">চাকরি</option>
        </select>

        <select
          value={type}
          onChange={(e) => updateFilter("type", e.target.value)}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none cursor-pointer"
        >
          <option value="">সব টাইপ</option>
          <option value="full">পূর্ণ কোর্স</option>
          <option value="revision">রিভিশন</option>
          <option value="mcq">MCQ</option>
          <option value="chapter">চ্যাপ্টার</option>
        </select>

        <select
          value={free}
          onChange={(e) => updateFilter("free", e.target.value)}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none cursor-pointer"
        >
          <option value="">সব</option>
          <option value="true">ফ্রি</option>
          <option value="false">পেইড</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500">লোড হচ্ছে...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">কোনো কোর্স পাওয়া যায়নি</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-zinc-500">লোড হচ্ছে...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
