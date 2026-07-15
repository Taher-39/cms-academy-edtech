"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left"
            >
              <span className="font-medium text-sm text-zinc-800 dark:text-zinc-100">
                {item.question}
              </span>
              <span
                className={`shrink-0 text-zinc-500 transition-transform ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
