interface HistoryTurn {
  role: "user" | "model";
  text: string;
}

const SYSTEM_PROMPT = `তুমি "CMS সহায়ক" — CMS Academy-এর ওয়েবসাইটে থাকা একটি বন্ধুত্বপূর্ণ AI সহকারী।
CMS Academy হলো বাংলাদেশের একটি বাংলা-মাধ্যম অনলাইন লার্নিং প্ল্যাটফর্ম, যেখানে ষষ্ঠ শ্রেণী থেকে
দ্বাদশ শ্রেণী পর্যন্ত একাডেমিক শিক্ষার্থী এবং চাকরিপ্রার্থীদের জন্য বিভিন্ন বিষয়ের (গণিত, আইসিটি, বিজ্ঞান,
টেক এবং যেকোনো নতুন বিষয়) রেকর্ডেড ও লাইভ কোর্স পাওয়া যায়।

নিয়মাবলী:
- সংক্ষিপ্ত, স্পষ্ট ও সহায়ক উত্তর দাও, সাধারণত বাংলায় (ব্যবহারকারী ইংরেজিতে লিখলে ইংরেজিতে উত্তর দাও)।
- কোর্স খোঁজা, এনরোলমেন্ট, পেমেন্ট, একাউন্ট/লগইন সংক্রান্ত সাধারণ প্রশ্নে সাহায্য করো।
- নির্দিষ্ট কোনো শিক্ষার্থীর পার্সোনাল ডেটা (পেমেন্ট, রেজাল্ট ইত্যাদি) সম্পর্কে তোমার কাছে তথ্য নেই — এসব
  প্রশ্নে ড্যাশবোর্ড দেখতে বা সাপোর্টে (ইমেইল/ফোন/WhatsApp) যোগাযোগ করতে বলো।
- তুমি নিশ্চিত না এমন তথ্য বানিয়ে বলবে না।`;

export async function chatWithAssistant(message: string, history: HistoryTurn[] = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw { status: 503, message: "AI সহকারী এখনো কনফিগার করা হয়নি" };
  }

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  const contents = [
    ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.6,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
  } catch (error) {
    console.error("Gemini API request failed:", error);
    throw { status: 502, message: "AI সহকারীর সাথে সংযোগ করা যায়নি" };
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Gemini API error:", res.status, errBody);
    throw { status: 502, message: "AI সহকারী থেকে উত্তর পাওয়া যায়নি" };
  }

  const data: any = await res.json();
  const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  return { reply: reply?.trim() || "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।" };
}
