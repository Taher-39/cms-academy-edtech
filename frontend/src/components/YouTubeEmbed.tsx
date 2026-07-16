"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

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
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 */
function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;

  // Try to extract ID from various YouTube URL formats
  const patterns = [
    // Standard watch URLs (with v= param anywhere)
    /(?:youtube\.com\/watch\?.*[&?]v=|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short URLs: youtu.be/
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URLs: youtube.com/embed/
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts: youtube.com/shorts/
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Live: youtube.com/live/
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    // Mobile: m.youtube.com
    /m\.youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
    // Plain video ID (11 chars)
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Try URL constructor fallback
  try {
    const parsed = new URL(url);
    const v = parsed.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  } catch {
    // Not a valid URL, ignore
  }

  return null;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

let ytApiPromise: Promise<void> | null = null;
/** Loads the YouTube IFrame API script once and shares the promise across every player instance. */
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

/**
 * Renders our own controls on top of a `controls=0` YouTube player instead of the native
 * chrome — the built-in player UI is where the Share button and end-of-video "watch next"
 * suggestions grid live, and YouTube doesn't expose a param to switch those off individually.
 */
export default function YouTubeEmbed({ url, title }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const videoId = getYoutubeVideoId(url);

  useEffect(() => {
    if (!loaded || !videoId || !playerContainerRef.current) return;

    let destroyed = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    loadYouTubeApi().then(() => {
      if (destroyed || !playerContainerRef.current) return;

      const player = new window.YT.Player(playerContainerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            setDuration(e.target.getDuration());
          },
          onStateChange: (e: any) => {
            const playing = e.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (playing) {
              setDuration(e.target.getDuration());
              interval = setInterval(() => {
                setCurrentTime(e.target.getCurrentTime());
              }, 250);
            } else if (interval) {
              clearInterval(interval);
              interval = null;
            }
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      destroyed = true;
      if (interval) clearInterval(interval);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [loaded, videoId]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

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

  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    muted ? playerRef.current.unMute() : playerRef.current.mute();
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current?.requestFullscreen();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setCurrentTime(value);
    playerRef.current?.seekTo(value, true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full aspect-video rounded-lg overflow-hidden bg-black group">
      {!loaded ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-zinc-900 cursor-pointer"
          onClick={() => setLoaded(true)}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium">{title || "ভিডিও দেখুন"}</p>
          </div>
        </div>
      ) : (
        <>
          <div ref={playerContainerRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          {/* Click-to-toggle-play overlay */}
          <button
            type="button"
            aria-label={isPlaying ? "থামান" : "চালান"}
            onClick={togglePlay}
            className="absolute inset-0 w-full h-full"
          />

          {/* Custom control bar — replaces YouTube's native chrome (no Share button, no related-video grid) */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-6 pb-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-opacity">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 accent-[#D97757] cursor-pointer"
              aria-label="ভিডিও সিক বার"
            />
            <div className="flex items-center gap-3 mt-1.5 text-white">
              <button type="button" onClick={togglePlay} aria-label={isPlaying ? "থামান" : "চালান"}>
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button type="button" onClick={toggleMute} aria-label={muted ? "শব্দ চালু করুন" : "মিউট করুন"}>
                {muted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14L21 18M21 14l-4 4M11 5L6 9H3v6h3l5 4V5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 010 7M18 6a9 9 0 010 12" />
                  </svg>
                )}
              </button>
              <span className="text-xs tabular-nums text-white/90">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button type="button" onClick={toggleFullscreen} aria-label="ফুলস্ক্রিন" className="ml-auto">
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m7 5l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4m7-5l5 5m0 0v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4m12-4v4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
