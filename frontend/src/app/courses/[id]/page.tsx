import { notFound } from "next/navigation";
import CourseDetailClient from "./CourseDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;

  let course: any = null;
  let lectures: any[] = [];
  let liveClasses: any[] = [];

  try {
    const [courseRes, lecturesRes, liveRes] = await Promise.all([
      fetch(`${API_URL}/api/courses/${id}`, { cache: "no-store" }),
      fetch(`${API_URL}/api/courses/${id}/lectures`, { cache: "no-store" }),
      fetch(`${API_URL}/api/courses/${id}/live`, { cache: "no-store" }),
    ]);

    if (courseRes.ok) {
      const data = await courseRes.json();
      course = data.course;
    }

    if (lecturesRes.ok) {
      const data = await lecturesRes.json();
      lectures = data.lectures || [];
    }

    if (liveRes.ok) {
      const data = await liveRes.json();
      liveClasses = data.liveClasses || [];
    }
  } catch (error) {
    console.error("Failed to fetch course details:", error);
  }

  if (!course) notFound();

  return (
    <CourseDetailClient
      course={JSON.parse(JSON.stringify(course))}
      lectures={JSON.parse(JSON.stringify(lectures))}
      liveClasses={JSON.parse(JSON.stringify(liveClasses))}
    />
  );
}
