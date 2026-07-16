import Link from "next/link";

const SOCIAL_LINKS = [
  {
    label: "Facebook গ্রুপ",
    href: "https://facebook.com/groups/cmsacademy",
    path: "M22 12a10 10 0 10-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9H16l-.4 2.9h-2.1v7A10 10 0 0022 12z",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@cms-academy",
    path: "M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.5V8.5L15.8 12l-6.2 3.5z",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/cms-academy",
    path: "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11.02-4.12 2.06 2.06 0 01-.02 4.12zM7.12 20.45H3.56V9h3.56v11.45z",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/cms.academy",
    path: "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 3.05a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zm0 11.13a4.38 4.38 0 110-8.76 4.38 4.38 0 010 8.76zm6.9-11.4a1.58 1.58 0 11-3.15 0 1.58 1.58 0 013.15 0z",
  },
  {
    label: "X",
    href: "https://x.com/cms_academy",
    path: "M18.24 2H21l-6.55 7.49L22.2 22h-6.4l-5-6.53L4.9 22H2.13l7-8.01L1.5 2h6.55l4.5 5.94L18.24 2zm-1.12 18.17h1.77L7 3.75H5.1l12.02 16.42z",
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@cms.academy",
    path: "M16.5 2h-3.2v13.3a2.9 2.9 0 11-2.06-2.78V9.3a6.1 6.1 0 105.26 6.05V8.9c1.02.72 2.27 1.14 3.6 1.14V6.85c-1.9 0-3.6-1.4-3.6-3.42V2z",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        {/* Brand */}
        <div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-500 mb-2">CMS Academy</h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            বাংলাদেশের শিক্ষার্থীদের জন্য অনলাইন লার্নিং প্ল্যাটফর্ম। ষষ্ঠ শ্রেণী থেকে চাকরি প্রার্থী পর্যন্ত সকলের জন্য কোর্স।
          </p>
          <div className="flex items-center gap-2 mt-4">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-[#0F5D5A] hover:text-white flex items-center justify-center transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-semibold mb-3 text-zinc-800 dark:text-zinc-200">গুরুত্বপূর্ণ লিংক</h4>
          <ul className="space-y-2">
            <li><Link href="/courses" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">কোর্সসমূহ</Link></li>
            <li><Link href="/contact" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">যোগাযোগ</Link></li>
            <li><Link href="/faq" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">সাধারণ জিজ্ঞাসা</Link></li>
            <li><Link href="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-500 transition">শর্তাবলী</Link></li>
          </ul>
          <Link
            href="/apply-teacher"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#D97757] hover:bg-[#E8916F] text-white text-sm font-medium transition"
          >
            🎓 শিক্ষক হিসেবে যোগ দিন
          </Link>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold mb-3 text-zinc-800 dark:text-zinc-200">যোগাযোগ</h4>
          <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>ইমেইল: cmsacademy25@gmail.com</li>
            <li>ফোন: ০১৫১৬৫৫৯৫১৫</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} CMS Academy. সমস্ত অধিকার সংরক্ষিত।
      </div>
    </footer>
  );
}
