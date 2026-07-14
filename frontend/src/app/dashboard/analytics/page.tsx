"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/store";
import { useToast } from "@/src/components/Toast";
import { useTheme } from "@/src/components/ThemeProvider";

interface Summary {
  totalRevenue: number;
  activeStudents: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
}

interface TrendPoint {
  label: string;
  revenue: number;
}

interface TopCourse {
  courseId: string;
  title: string;
  revenue: number;
  enrollments: number;
}

// Reference blue hue from the dataviz palette (single sequential series).
const LINE_COLOR = { light: "#2a78d6", dark: "#3987e5" };

function formatTaka(n: number) {
  return `৳${n.toLocaleString("en-US")}`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-800 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function RevenueTrendChart({ trend }: { trend: TrendPoint[] }) {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === "dark" ? LINE_COLOR.dark : LINE_COLOR.light;
  const gridColor = resolvedTheme === "dark" ? "#2c2c2a" : "#e1e0d9";
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 640;
  const height = 240;
  const padding = { top: 16, right: 16, bottom: 28, left: 48 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxRevenue = Math.max(1, ...trend.map((t) => t.revenue));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxRevenue * f));

  const points = trend.map((t, i) => {
    const x = padding.left + (trend.length === 1 ? plotW / 2 : (i / (trend.length - 1)) * plotW);
    const y = padding.top + plotH - (t.revenue / maxRevenue) * plotH;
    return { x, y, ...t };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${padding.top + plotH} L ${points[0]?.x || 0} ${padding.top + plotH} Z`;

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  };

  const active = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        {yTicks.map((tick, i) => {
          const y = padding.top + plotH - (tick / maxRevenue) * plotH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#898781"
              >
                {tick >= 1000 ? `${Math.round(tick / 1000)}K` : tick}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={color} fillOpacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoverIdx === i ? 5 : 4}
            fill={color}
            stroke={resolvedTheme === "dark" ? "#1a1a19" : "#fcfcfb"}
            strokeWidth={2}
          />
        ))}

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={padding.top}
            y2={padding.top + plotH}
            stroke={gridColor}
            strokeWidth={1}
          />
        )}

        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#898781"
          >
            {p.label}
          </text>
        ))}
      </svg>

      {active && (
        <div
          className="absolute px-3 py-2 rounded-lg text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg pointer-events-none"
          style={{
            left: `${(active.x / width) * 100}%`,
            top: 0,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">{formatTaka(active.revenue)}</p>
          <p className="text-zinc-500 dark:text-zinc-400">{active.label}</p>
        </div>
      )}
    </div>
  );
}

function TopCoursesBars({ courses }: { courses: TopCourse[] }) {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === "dark" ? LINE_COLOR.dark : LINE_COLOR.light;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const maxRevenue = Math.max(1, ...courses.map((c) => c.revenue));

  if (courses.length === 0) {
    return <p className="text-sm text-zinc-500">এখনো কোনো বিক্রি হয়নি</p>;
  }

  return (
    <div className="space-y-3">
      {courses.map((c, i) => {
        const pct = Math.max(4, (c.revenue / maxRevenue) * 100);
        return (
          <div
            key={c.courseId}
            className="relative"
            onPointerEnter={() => setHoverIdx(i)}
            onPointerLeave={() => setHoverIdx(null)}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-700 dark:text-zinc-300 truncate pr-2">{c.title}</span>
              <span className="text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                {formatTaka(c.revenue)}
              </span>
            </div>
            <div className="h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            {hoverIdx === i && (
              <div className="absolute -top-9 left-0 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg z-10">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{c.enrollments}</span>
                <span className="text-zinc-500 dark:text-zinc-400"> জন এনরোল্ড</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || (user?.role !== "admin" && user?.role !== "superAdmin")) {
      addToast("অ্যাক্সেস নেই", "error");
      router.push("/dashboard");
      return;
    }
    fetchAll();
  }, [token, user, router]);

  const fetchAll = async () => {
    try {
      const [summaryRes, trendRes, topRes] = await Promise.all([
        api.get("/api/admin/analytics/summary"),
        api.get("/api/admin/analytics/revenue-trend"),
        api.get("/api/admin/analytics/top-courses"),
      ]);
      setSummary(summaryRes.data);
      setTrend(trendRes.data.trend || []);
      setTopCourses(topRes.data.topCourses || []);
    } catch {
      addToast("অ্যানালিটিক্স তথ্য লোড করা যায়নি", "error");
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-800 dark:text-zinc-500 hover:underline mb-2 inline-block"
        >
          &larr; ড্যাশবোর্ডে ফিরুন
        </Link>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          📊 অ্যানালিটিক্স
        </h1>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatTile label="মোট রেভিনিউ" value={formatTaka(summary.totalRevenue)} />
          <StatTile label="সক্রিয় শিক্ষার্থী" value={summary.activeStudents.toLocaleString("en-US")} />
          <StatTile label="মোট শিক্ষার্থী" value={summary.totalStudents.toLocaleString("en-US")} />
          <StatTile label="মোট শিক্ষক" value={summary.totalTeachers.toLocaleString("en-US")} />
          <StatTile label="মোট কোর্স" value={summary.totalCourses.toLocaleString("en-US")} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-sm font-semibold mb-4 text-zinc-700 dark:text-zinc-300">
            মাসিক রেভিনিউ (গত ৬ মাস)
          </h2>
          {trend.length === 0 ? (
            <p className="text-sm text-zinc-500">কোনো তথ্য নেই</p>
          ) : (
            <RevenueTrendChart trend={trend} />
          )}
        </div>

        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-sm font-semibold mb-4 text-zinc-700 dark:text-zinc-300">
            শীর্ষ কোর্সসমূহ (রেভিনিউ অনুযায়ী)
          </h2>
          <TopCoursesBars courses={topCourses} />
        </div>
      </div>
    </div>
  );
}
