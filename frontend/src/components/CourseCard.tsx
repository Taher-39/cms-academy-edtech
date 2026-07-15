import Link from "next/link";

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    description: string;
    category: string;
    classLevel: string;
    subject: string;
    type: string;
    price: number;
    regularPrice?: number;
    discountPercent?: number;
    thumbnail?: string;
    teacher?: { name: string; email?: string };
    isLive?: boolean;
    enrolledStudents?: string[];
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course._id}`}>
      <div className="group h-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-lg transition shadow-sm">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-zinc-700 to-zinc-700 flex items-center justify-center">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-white/80 font-bold">
              {course.title.charAt(0)}
            </span>
          )}
          {course.isLive && (
            <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-red-600 text-white font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              লাইভ
            </span>
          )}
          {course.price === 0 && (
            <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-emerald-600 text-white font-medium">
              ফ্রি
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-400">
              {course.category === "academic" ? "একাডেমিক" : "চাকরি"}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
              {course.classLevel === "6-8"
                ? "৬ষ্ঠ-৮ম"
                : course.classLevel === "9-10"
                ? "৯ম-১০ম"
                : course.classLevel === "11-12"
                ? "১১শ-১২শ"
                : "চাকরি"}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
              {course.subject}
            </span>
            {!!course.discountPercent && course.discountPercent > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold">
                -{course.discountPercent}%
              </span>
            )}
          </div>

          <h3 className="font-semibold text-lg mb-2 text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-500 transition">
            {course.title}
          </h3>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4">
            {course.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {course.teacher?.name || "শিক্ষক"}
              {course.enrolledStudents && course.enrolledStudents.length > 0 && (
                <> · {course.enrolledStudents.length.toLocaleString("bn-BD")} জন</>
              )}
            </span>
            <div className="flex items-center gap-2">
              {!!course.regularPrice && course.regularPrice > course.price && (
                <span className="text-sm text-zinc-400 line-through">
                  ৳{course.regularPrice}
                </span>
              )}
              <span className="font-bold text-lg text-zinc-800 dark:text-zinc-500">
                {course.price === 0 ? "ফ্রি" : `৳${course.price}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
