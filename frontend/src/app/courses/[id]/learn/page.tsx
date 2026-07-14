import { notFound } from "next/navigation";
import LearnClient from "./LearnClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default async function CoursePlayerPage({ params }: PageProps) {
  const { id } = await params;

  let course: any = null;
  let lectures: any[] = [];

  try {
    const [courseRes, lecturesRes] = await Promise.all([
      fetch(`${API_URL}/api/courses/${id}`, { cache: "no-store" }),
      fetch(`${API_URL}/api/courses/${id}/lectures`, { cache: "no-store" }),
    ]);

    if (courseRes.ok) {
      const data = await courseRes.json();
      course = data.course;
    }
    if (lecturesRes.ok) {
      const data = await lecturesRes.json();
      lectures = data.lectures || [];
    }
  } catch (error) {
    console.error("Failed to fetch course for player:", error);
  }

  if (!course) notFound();

  return (
    <LearnClient
      course={JSON.parse(JSON.stringify(course))}
      lectures={JSON.parse(JSON.stringify(lectures))}
    />
  );
}
