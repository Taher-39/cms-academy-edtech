"use client";

import { useEffect, useState } from "react";
import api from "@/src/lib/api";

export default function TermsPage() {
  const [termsHtml, setTermsHtml] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/settings");
        const content: string = res.data?.settings?.termsContent || "";
        if (content.trim()) setTermsHtml(content);
      } catch {
        // keep fallback content
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">
        শর্তাবলী
      </h1>

      {termsHtml ? (
        <div
          className="prose dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-800 dark:[&_h2]:text-zinc-100"
          dangerouslySetInnerHTML={{ __html: termsHtml }}
        />
      ) : (
        <div className="prose dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400">
          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              ১. সার্ভিস সম্পর্কে
            </h2>
            <p>
              CMS Academy একটি অনলাইন লার্নিং প্ল্যাটফর্ম। এখানে প্রদত্ত সকল কোর্স,
              লেকচার এবং শিক্ষা সংক্রান্ত সামগ্রী শিক্ষার্থীদের ব্যক্তিগত ব্যবহারের
              জন্য। কোন সামগ্রী পুনর্বিতরণ, পুনর্বিক্রয় বা বাণিজ্যিক কাজে ব্যবহার
              করা যাবে না।
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              ২. অ্যাকাউন্ট এবং রেজিস্ট্রেশন
            </h2>
            <p>
              একজন ব্যবহারকারী শুধুমাত্র একটি অ্যাকাউন্ট রাখতে পারবেন। রেজিস্ট্রেশনের
              সময় প্রদত্ত তথ্য সঠিক হতে হবে। অ্যাকাউন্টের নিরাপত্তা ব্যবহারকারীর
              দায়িত্ব।
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              ৩. পেমেন্ট এবং রিফান্ড
            </h2>
            <p>
              সকল পেমেন্ট SSLCommerz এর মাধ্যমে সম্পন্ন হয়। কোর্সে এনরোল করার পর
              কোনো প্রকার টাকা ফেরত (রিফান্ড) দেওয়া হবে না, যদি না কোর্স সম্পর্কিত
              কোনো প্রযুক্তিগত ত্রুটি থাকে।
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              ৪. কোর্সের মেয়াদ
            </h2>
            <p>
              প্রতিটি কোর্সের মেয়াদ ৬ মাস। মেয়াদ শেষ হওয়ার পরে কোর্সটিতে
              শিক্ষার্থীর অ্যাক্সেস থাকবে না। তবে শিক্ষার্থী চাইলে পুনরায় এনরোল
              করতে পারবেন।
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              ৫. দায় সীমাবদ্ধতা
            </h2>
            <p>
              CMS Academy তার কোর্সের মাধ্যমে প্রাপ্ত ফলাফলের জন্য কোনো গ্যারান্টি
              দেয় না। শিক্ষার্থীদের ব্যক্তিগত প্রচেষ্টা এবং নিয়মিত অনুশীলনের উপর
              ফলাফল নির্ভর করে।
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              ৬. কপিরাইট এবং বৌদ্ধিক সম্পত্তি
            </h2>
            <p>
              সকল কোর্সের বিষয়বস্তু, ভিডিও, নোট এবং শিক্ষা সংক্রান্ত সামগ্রী CMS
              Academy এর বৌদ্ধিক সম্পত্তি। অনুমতি ছাড়া এগুলো কপি, বিতরণ বা
              পুনর্বিক্রয় করা আইনত দণ্ডনীয় অপরাধ।
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              ৭. গোপনীয়তা নীতি
            </h2>
            <p>
              ব্যবহারকারীদের ব্যক্তিগত তথ্য গোপন রাখা হবে। শুধুমাত্র সার্ভিস
              প্রদানের জন্য প্রয়োজনীয় তথ্য ব্যবহার করা হবে।
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
