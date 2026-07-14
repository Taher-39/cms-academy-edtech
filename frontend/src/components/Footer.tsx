import Link from "next/link";

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
