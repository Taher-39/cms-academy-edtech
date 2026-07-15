"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <>
        {/* Dashboard topbar */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-700">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold">
                CMS
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Dashboard</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Admin / Teacher panel</p>
              </div>
            </Link>
            <Link
              href="/"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              ⬅ হোমে ফিরুন
            </Link>
          </div>
        </div>
        {children}
        {/* Dashboard footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} CMS Academy. সমস্ত অধিকার সংরক্ষিত।
          </div>
        </footer>
      </>
    );
  }


  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
