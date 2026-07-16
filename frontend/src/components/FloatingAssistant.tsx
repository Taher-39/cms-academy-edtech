"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/src/lib/api";

const WHATSAPP_NUMBER = "8801516559515";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "model",
  text: "আসসালামু আলাইকুম! আমি CMS সহায়ক — কোর্স, এনরোলমেন্ট বা অ্যাকাউন্ট নিয়ে কোনো প্রশ্ন থাকলে জিজ্ঞাসা করুন।",
};

/** Chat-bubble-with-spark mark used for the CMS AI assistant everywhere it appears. */
function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      />
      <path fill="currentColor" d="M12.5 7.8l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" />
    </svg>
  );
}

export default function FloatingAssistant() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history = messages.slice(-10);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/api/assistant/chat", { message: text, history });
      setMessages((prev) => [...prev, { role: "model", text: res.data.reply }]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "দুঃখিত, এই মুহূর্তে উত্তর দেওয়া যাচ্ছে না।";
      setMessages((prev) => [...prev, { role: "model", text: msg }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {/* Chat panel */}
      {chatOpen && (
        <div className="mb-1 w-[92vw] max-w-[340px] h-[460px] max-h-[70vh] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0F5D5A] text-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <BotIcon className="w-4 h-4 text-[#D97757]" />
              </span>
              <span className="text-sm font-semibold">CMS সহায়ক</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              aria-label="বন্ধ করুন"
              className="text-white/80 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[#0F5D5A] text-white rounded-br-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                  লিখছে...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-2.5 border-t border-zinc-200 dark:border-zinc-700 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="আপনার প্রশ্ন লিখুন..."
              disabled={sending}
              className="flex-1 px-3 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-[#D97757]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="পাঠান"
              className="w-9 h-9 rounded-full bg-[#D97757] hover:bg-[#E8916F] disabled:opacity-50 text-white flex items-center justify-center transition shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.94 2.06a1 1 0 011.05-.02l14 8a1 1 0 010 1.72l-14 8a1 1 0 01-1.48-1.1L4.6 12 2.51 3.34a1 1 0 01.43-1.28z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Chat toggle button */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        aria-label="AI সহায়ক চ্যাট"
        className="w-14 h-14 rounded-full bg-[#0F5D5A] hover:bg-[#14746F] text-white flex items-center justify-center shadow-lg transition"
      >
        {chatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <BotIcon className="w-7 h-7" />
        )}
      </button>
      
      {/* WhatsApp button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp-এ যোগাযোগ করুন"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg transition"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.5 1.34 5.02L2 22l5.13-1.35A9.96 9.96 0 0012.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.15a8.13 8.13 0 01-4.15-1.14l-.3-.18-3.05.8.81-2.97-.19-.3a8.13 8.13 0 01-1.24-4.36c0-4.5 3.66-8.15 8.16-8.15 2.18 0 4.22.85 5.76 2.39a8.09 8.09 0 012.39 5.76c0 4.5-3.66 8.15-8.19 8.15zm4.48-6.11c-.25-.12-1.45-.71-1.67-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.45-1.37-1.7-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14-.01-.31-.01-.47-.01-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.06 0 1.22.89 2.39 1.01 2.56.12.16 1.75 2.68 4.25 3.75.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.45-.59 1.65-1.16.21-.57.21-1.06.14-1.16-.06-.11-.22-.17-.47-.29z" />
        </svg>
      </a>

    </div>
  );
}
