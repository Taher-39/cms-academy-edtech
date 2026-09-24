"use client";

import { useState } from "react";

interface Props {
  rating: number;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onChange?: (rating: number) => void;
}

const SIZES = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" };

export default function StarRating({ rating, size = "sm", editable = false, onChange }: Props) {
  const [hover, setHover] = useState(0);
  const active = hover || rating;

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} স্টার`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const star = (
          <svg
            viewBox="0 0 20 20"
            className={`${SIZES[size]} ${
              i <= Math.round(active) ? "fill-amber-400" : "fill-zinc-300 dark:fill-zinc-700"
            }`}
          >
            <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.9l-5.2 2.61.99-5.79-4.21-4.1 5.82-.85z" />
          </svg>
        );

        if (!editable) return <span key={i}>{star}</span>;

        return (
          <button
            key={i}
            type="button"
            aria-label={`${i} স্টার দিন`}
            onClick={() => onChange?.(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition hover:scale-110"
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}
