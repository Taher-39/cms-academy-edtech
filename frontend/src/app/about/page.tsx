import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          CMS Academy সম্পর্কে
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          বাংলাদেশের শিক্ষার্থীদের জন্য একটি আধুনিক অনলাইন লার্নিং প্ল্যাটফর্ম।
          ষষ্ঠ শ্রেণী থেকে চাকরি প্রার্থী পর্যন্ত সকলের জন্য মানসম্মত গণিত ও বিজ্ঞান শিক্ষা।
        </p>
      </div>

      {/* Mission */}
      <section className="mb-12 p-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
        <h2 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          🎯 আমাদের লক্ষ্য
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          CMS Academy-এর লক্ষ্য হলো বাংলাদেশের প্রতিটি জেলা-উপজেলার শিক্ষার্থীদের 
          মানসম্মত গণিত ও বিজ্ঞান শিক্ষা প্রদান করা। আমরা বিশ্বাস করি, প্রযুক্তির 
          সঠিক ব্যবহারের মাধ্যমে শিক্ষার গুণগত মান বৃদ্ধি করা সম্ভব। আমাদের প্ল্যাটফর্মে 
          শিক্ষার্থীরা তাদের সুবিধামত সময়ে ভিডিও লেকচার দেখতে পারে, নোট ডাউনলোড করতে 
          পারে এবং লাইভ ক্লাসে অংশগ্রহণ করতে পারে।
        </p>
      </section>

      {/* Founder */}
      <section className="mb-12 p-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
        <h2 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          👨‍🏫 প্রতিষ্ঠাতা
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-700 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            AT
          </div>
          <div>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              আবু তাহের
            </h3>
            <p className="text-sm text-zinc-500 mb-3">প্রতিষ্ঠাতা ও প্রধান শিক্ষক</p>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              গণিত শিক্ষায় দীর্ঘ অভিজ্ঞতা সম্পন্ন আবু তাহের বিশ্বাস করেন, সঠিক দিকনির্দেশনা 
              ও নিয়মিত চর্চার মাধ্যমে যেকোনো শিক্ষার্থী গণিতে দক্ষতা অর্জন করতে পারে। 
              তার উদ্দেশ্য হলো শিক্ষার্থীদের জন্য একটি সহজ, সাশ্রয়ী ও কার্যকরী শিক্ষা 
              প্ল্যাটফর্ম তৈরি করা।
            </p>
          </div>
        </div>
      </section>

      {/* YouTube Channel */}
      <section className="mb-12 p-8 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">YouTube</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
              আমাদের YouTube চ্যানেল
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              ফ্রি লেকচার, টিপস ও টিউটোরিয়ালের জন্য আমাদের YouTube চ্যানেলটি সাবস্ক্রাইব করুন। 
              নিয়মিত আপডেট পেতে বেল আইকনে ক্লিক করুন।
            </p>
            <a
              href="https://youtube.com/@cmsacademy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              চ্যানেলটি দেখুন
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "শিক্ষার্থী", value: "৫০০০+" },
            { label: "কোর্স", value: "৫০+" },
            { label: "ভিডিও লেকচার", value: "২০০+" },
            { label: "লাইভ ক্লাস", value: "১০০+" },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 text-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
            >
              <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-500 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center p-8 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-800 text-white">
        <h2 className="text-2xl font-bold mb-3">
          আজই শুরু করুন আপনার লার্নিং জার্নি
        </h2>
        <p className="text-zinc-100 mb-6 max-w-xl mx-auto">
          ফ্রি কোর্স থেকে শুরু করুন, বা পেইড কোর্সে এনরোল করুন।
          প্রথম ৩ লেকচার প্রতিটি কোর্সে ফ্রি!
        </p>
        <Link
          href="/courses"
          className="inline-block px-8 py-3 bg-white text-zinc-900 rounded-lg font-semibold hover:bg-zinc-50 transition"
        >
          কোর্সসমূহ দেখুন
        </Link>
      </section>
    </div>
  );
}
