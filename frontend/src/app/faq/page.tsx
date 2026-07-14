"use client";

import { useEffect, useState } from "react";
import api from "@/src/lib/api";

const fallbackFaqs = [
  {
    q: "CMS Academy কী?",
    a: "CMS Academy একটি অনলাইন লার্নিং প্ল্যাটফর্ম যা বাংলাদেশের শিক্ষার্থীদের জন্য ডিজাইন করা হয়েছে। এখানে ৬ষ্ঠ থেকে ১২শ শ্রেণী পর্যন্ত একাডেমিক কোর্স এবং চাকরি প্রার্থীদের জন্য BCS, NTRCA সহ বিভিন্ন কোর্স রয়েছে।",
  },
  {
    q: "কিভাবে রেজিস্ট্রেশন করব?",
    a: "রেজিস্ট্রেশন পেইজে গিয়ে আপনার নাম, ইমেইল এবং পাসওয়ার্ড দিন। তারপর আপনার ইমেইলে পাঠানো OTP ভেরিফাই করে রেজিস্ট্রেশন সম্পন্ন করুন। এছাড়া Google অ্যাকাউন্ট দিয়েও রেজিস্ট্রেশন করতে পারবেন।",
  },
  {
    q: "কোর্সে এনরোল করার নিয়ম কী?",
    a: "ফ্রি কোর্সে সরাসরি এনরোল করতে পারবেন। পেইড কোর্সের জন্য SSLCommerz এর মাধ্যমে পেমেন্ট করতে হবে। পেমেন্ট সফল হলে আপনার অ্যাকাউন্টে কোর্সটি যুক্ত হবে।",
  },
  {
    q: "পূর্বের শিক্ষার্থীদের জন্য কি কোনো ছাড় আছে?",
    a: "হ্যাঁ, পূর্বের শিক্ষার্থীদের জন্য ২০০ টাকা ছাড় রয়েছে। আপনি যদি পূর্বে কোনো কোর্স করে থাকেন, তাহলে পরবর্তী কোর্সে ২০০ টাকা ছাড় পাবেন।",
  },
  {
    q: "কোর্সের মেয়াদ কতদিন?",
    a: "প্রতিটি কোর্সের মেয়াদ ৬ মাস। এই সময়ের মধ্যে আপনি সকল লেকচার দেখতে পারবেন এবং Q&A সেকশনে প্রশ্ন করতে পারবেন।",
  },
  {
    q: "প্রথম কয়টি লেকচার ফ্রি?",
    a: "প্রতিটি পেইড কোর্সের প্রথম ৩টি লেকচার ফ্রি। এগুলো দেখে আপনি কোর্সের মান বুঝে নিতে পারেন, তারপর এনরোল করার সিদ্ধান্ত নিতে পারেন।",
  },
  {
    q: "লাইভ ক্লাস কিভাবে হয়?",
    a: "লাইভ ক্লাস Google Meet এর মাধ্যমে হয়। কোর্সের লাইভ ক্লাস সেকশন থেকে আপনি মিট লিংকে যোগ দিতে পারবেন। লাইভ ক্লাসের রেকর্ডিং পরবর্তীতে আপলোড করা হয়।",
  },
  {
    q: "Q&A সেকশন কিভাবে কাজ করে?",
    a: "শুধুমাত্র এনরোল্ড শিক্ষার্থীরা Q&A সেকশনে প্রশ্ন করতে পারেন। শিক্ষক বা অ্যাডমিন আপনার প্রশ্নের উত্তর দেবেন।",
  },
  {
    q: "পেমেন্ট অপশন কী কী?",
    a: "SSLCommerz এর মাধ্যমে বিকাশ, নগদ, রকেট, ব্যাংক কার্ড সহ বিভিন্ন মাধ্যমে পেমেন্ট করতে পারবেন।",
  },
  {
    q: "কোর্স শেষ হওয়ার পরে কি আবার দেখতে পারব?",
    a: "মেয়াদ শেষ হওয়ার পরে কোর্সটি আপনার অ্যাকাউন্ট থেকে সরিয়ে নেওয়া হবে। তবে আপনি চাইলে পুনরায় এনরোল করতে পারবেন।",
  },
];

interface Faq {
  question: string;
  answer: string;
  order: number;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>(fallbackFaqs);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/settings");
        const remoteFaqs: Faq[] = res.data?.settings?.faqs || [];
        if (remoteFaqs.length > 0) {
          setFaqs(
            [...remoteFaqs]
              .sort((a, b) => a.order - b.order)
              .map((f) => ({ q: f.question, a: f.answer }))
          );
        }
      } catch {
        // keep fallback content
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">
        সাধারণ জিজ্ঞাসা (FAQ)
      </h1>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden"
          >
            <summary className="px-6 py-4 cursor-pointer font-medium text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition list-none flex items-center justify-between">
              <span>{faq.q}</span>
              <svg
                className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-6 pb-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
