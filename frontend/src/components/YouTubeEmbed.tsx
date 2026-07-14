"use client";

import { useState } from "react";

interface Props {
  url: string;
  title?: string;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function getYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function YouTubeEmbed({ url, title }: Props) {
  const [loaded, setLoaded] = useState(false);
  const videoId = getYoutubeVideoId(url);

  if (!videoId) {
    // Fallback: show as regular link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-800 dark:text-zinc-500 hover:underline"
      >
        🎬 {title || "ভিডিও দেখুন"}
      </a>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 cursor-pointer" onClick={() => setLoaded(true)}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium">{title || "ভিডিও দেখুন"}</p>
          </div>
        </div>
      )}
      {(loaded || !loaded) && (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${loaded ? 1 : 0}&rel=0`}
          title={title || "Video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      )}
    </div>
  );
}
