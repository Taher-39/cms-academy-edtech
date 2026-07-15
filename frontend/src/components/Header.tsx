"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useAuthStore } from "@/src/lib/store";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "হোম" },
  { href: "/courses", label: "কোর্সসমূহ" },
  { href: "/about", label: "সম্পর্কে" },
  { href: "/contact", label: "যোগাযোগ" },
];

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/courses?search=${encodeURIComponent(q)}` : "/courses");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* Utility bar */}
      <div className="hidden md:block bg-primary text-white/90 text-xs">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="mailto:support@cmsacademy.com" className="flex items-center gap-1.5 hover:text-white transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@cmsacademy.com
            </a>
            <a href="tel:+8801516559515" className="flex items-center gap-1.5 hover:text-white transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              ০১৫১৬৫৫৯৫১৫
            </a>
          </div>
          <span>বাংলাদেশের শিক্ষার্থীদের জন্য অনলাইন লার্নিং প্ল্যাটফর্ম</span>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-black/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
              CMS
            </span>
            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100 hidden sm:inline">
              CMS Academy
            </span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
            <div className="flex w-full rounded-full border border-zinc-300 dark:border-zinc-600 overflow-hidden focus-within:ring-2 focus-within:ring-accent">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="কী শিখতে চান? কোর্স খুঁজুন..."
                className="flex-1 px-4 py-2 text-sm bg-transparent text-zinc-900 dark:text-zinc-100 outline-none"
              />
              <button
                type="submit"
                aria-label="সার্চ করুন"
                className="px-4 bg-accent hover:bg-accent-light text-white flex items-center justify-center transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium shrink-0">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-zinc-700 dark:text-zinc-300 hover:text-primary dark:hover:text-accent-light transition">
                {link.label}
              </Link>
            ))}
            {user && (
              <Link href="/dashboard" className="text-zinc-700 dark:text-zinc-300 hover:text-primary dark:hover:text-accent-light transition">
                ড্যাশবোর্ড
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
            <ThemeToggle />
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                >
                  লগআউট
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex text-sm px-5 py-1.5 rounded-full bg-accent hover:bg-accent-light text-white font-semibold transition"
              >
                লগইন
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black px-4 py-4 space-y-4">
          <form onSubmit={submitSearch} className="flex rounded-full border border-zinc-300 dark:border-zinc-600 overflow-hidden">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="কী শিখতে চান?"
              className="flex-1 px-4 py-2 text-sm bg-transparent text-zinc-900 dark:text-zinc-100 outline-none"
            />
            <button type="submit" aria-label="সার্চ করুন" className="px-4 bg-accent text-white flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          <div className="space-y-3 text-zinc-800 dark:text-zinc-200">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {user && <Link href="/dashboard" className="block" onClick={() => setMenuOpen(false)}>ড্যাশবোর্ড</Link>}
          </div>

          <a href="tel:+8801516559515" className="flex items-center gap-1.5 text-sm text-primary dark:text-accent-light">
            📞 ০১৫১৬৫৫৯৫১৫
          </a>

          {user ? (
            <button onClick={() => { logout(); setMenuOpen(false); }} className="text-red-500 font-medium">লগআউট</button>
          ) : (
            <Link
              href="/login"
              className="block text-center px-4 py-2 rounded-full bg-accent text-white font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              লগইন
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
