import Link from "next/link";
import CourseCard from "@/src/components/CourseCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getFeaturedCourses() {
  try {
    const res = await fetch(`${API_URL}/api/courses?limit=6`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.courses || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const courses = await getFeaturedCourses();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            CMS Academy
          </h1>
          <p className="text-lg md:text-xl text-zinc-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            বাংলাদেশের শিক্ষার্থীদের জন্য অনলাইন লার্নিং প্ল্যাটফর্ম। 
            ষষ্ঠ শ্রেণী থেকে চাকরি প্রার্থী পর্যন্ত সকলের জন্য মানসম্মত শিক্ষা।
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/courses"
              className="px-8 py-3 bg-white text-zinc-800 rounded-lg font-semibold hover:bg-zinc-100 transition"
            >
              কোর্সসমূহ দেখুন
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 border-2 border-white/30 text-white rounded-lg font-semibold hover:bg-white/10 transition"
            >
              এখনই রেজিস্ট্রেশন করুন
            </Link>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            আমাদের কোর্সসমূহ
          </h2>
          <Link
            href="/courses"
            className="hidden sm:inline-block text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
          >
            সব কোর্স দেখুন →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            এই মুহূর্তে কোনো কোর্স পাওয়া যায়নি
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/courses"
            className="inline-block px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            সব কোর্স দেখুন →
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-zinc-800 dark:text-zinc-100">
          কেন CMS Academy?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "একাডেমিক কোর্স",
              desc: "৬ষ্ঠ থেকে ১২শ শ্রেণী পর্যন্ত গণিত, উচ্চতর গণিত ও আইসিটি কোর্স",
            },
            {
              title: "চাকরি প্রস্তুতি",
              desc: "BCS, NTRCA সহ সকল চাকরির পরীক্ষার জন্য গণিত কোর্স",
            },
            {
              title: "লাইভ ও প্রি-রেকর্ডেড",
              desc: "লাইভ ক্লাসের রেকর্ডিং সহ ভিডিও লেকচার যেকোনো সময় দেখুন",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-xl font-semibold mb-3 text-zinc-800 dark:text-zinc-100">
                {feature.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "শিক্ষার্থী", value: "৫০০+", icon: "👨‍🎓" },
            { label: "কোর্স", value: "১০+", icon: "📚" },
            { label: "ভিডিও লেকচার", value: "২০০+", icon: "🎬" },
            { label: "লাইভ ক্লাস", value: "১০০+", icon: "📺" },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 text-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition"
            >
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-400 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* YouTube Channel Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="p-8 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-3">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">YouTube</p>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-3 text-zinc-800 dark:text-zinc-100">
                আমাদের YouTube চ্যানেল
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed max-w-xl">
                ফ্রি লেকচার, টিপস ও টিউটোরিয়ালের জন্য আমাদের YouTube চ্যানেলটি সাবস্ক্রাইব করুন। 
                নিয়মিত আপডেট পেতে বেল আইকনে ক্লিক করুন।
              </p>
              <a
                href="https://youtube.com/@cms-academy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                চ্যানেলটি দেখুন
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-zinc-800 dark:text-zinc-100">
          শিক্ষার্থীদের মতামত
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "রাফি হাসান",
              role: "SSC ২০২৫",
              text: "CMS Academy থেকে গণিত কোর্স করে আমি অনেক উপকৃত হয়েছি। শিক্ষকের বোঝানোর স্টাইল অসাধারণ।",
            },
            {
              name: "নুসরাত জাহান",
              role: "HSC ২০২৫",
              text: "উচ্চতর গণিতের জন্য এই প্ল্যাটফর্মটি দারুণ। লাইভ ক্লাসের রেকর্ডিং দেখে পরে প্র্যাকটিস করতে পারছি।",
            },
            {
              name: "মোঃ সাগর",
              role: "BCS প্রার্থী",
              text: "BCS গণিতের জন্য একটি সম্পূর্ণ কোর্স পেয়ে আমি খুবই খুশি। মূল্যবান টিপস ও ট্রিকস আমার অনেক কাজে লেগেছে।",
            },
          ].map((t, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center gap-1 text-yellow-400 mb-3">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-100">{t.name}</p>
                <p className="text-xs text-zinc-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-zinc-800 to-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            আজই শুরু করুন আপনার লার্নিং জার্নি
          </h2>
          <p className="text-zinc-100 mb-8 max-w-xl mx-auto">
            ফ্রি কোর্স থেকে শুরু করুন, বা পেইড কোর্সে এনরোল করুন। প্রথম ৩ লেকচার প্রতিটি কোর্সে ফ্রি!
          </p>
          <Link
            href="/courses"
            className="inline-block px-8 py-3 bg-white text-zinc-800 rounded-lg font-semibold hover:bg-zinc-100 transition"
          >
            সব কোর্স দেখুন
          </Link>
        </div>
      </section>
    </div>
  );
}
