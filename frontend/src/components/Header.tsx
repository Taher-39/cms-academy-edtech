"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuthStore } from "@/src/lib/store";
import { useState } from "react";

export default function Header() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-black/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-zinc-800 dark:text-zinc-500">
          CMS Academy
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">
            হোম
          </Link>
          <Link href="/courses" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">
            কোর্সসমূহ
          </Link>
          <Link href="/about" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">
            সম্পর্কে
          </Link>
          {user && (
            <Link href="/dashboard" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">
              ড্যাশবোর্ড
            </Link>
          )}
          <Link href="/contact" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">
            যোগাযোগ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{user.name}</span>
              <button
                onClick={logout}
                className="text-sm px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
              >
                লগআউট
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-flex text-sm px-4 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-900 text-white hover:bg-zinc-900 transition"
            >
              লগইন
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-black px-4 py-4 space-y-3">
          <Link href="/" className="block" onClick={() => setMenuOpen(false)}>হোম</Link>
          <Link href="/courses" className="block" onClick={() => setMenuOpen(false)}>কোর্সসমূহ</Link>
          <Link href="/about" className="block" onClick={() => setMenuOpen(false)}>সম্পর্কে</Link>
          {user && <Link href="/dashboard" className="block" onClick={() => setMenuOpen(false)}>ড্যাশবোর্ড</Link>}
          <Link href="/contact" className="block" onClick={() => setMenuOpen(false)}>যোগাযোগ</Link>
          {user ? (
            <button onClick={() => { logout(); setMenuOpen(false); }} className="text-red-500">লগআউট</button>
          ) : (
            <Link href="/login" className="block text-zinc-800" onClick={() => setMenuOpen(false)}>লগইন</Link>
          )}
        </div>
      )}
    </header>
  );
}
