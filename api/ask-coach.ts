// Node runtime serverless function (works with env vars on Vercel)
// File: api/ask-coach.ts

export const config = {
  runtime: "nodejs",
};

type Mode = "structured" | "free";

const personas: Record<
  string,
  { header: string; sign: string; desc: string }
> = {
  Nia: {
    header: "🧡 Coach Nia — Motivational · “Find your purpose. Fuel your passion.”",
    sign: "— Coach Nia",
    desc: "You are uplifting, energetic, and encouraging.",
  },
  Raya: {
    header: "🌿 Coach Raya — Supportive · “You’re not alone. We’ll grow together.”",
    sign: "— Coach Raya",
    desc: "You are gentle, empathetic, and patient.",
  },
  Vera: {
    header: "💬 Coach Vera — Collaborative · “We’ll uncover the best path together.”",
    sign: "— Coach Vera",
    desc: "You are calm, balanced, and insightful.",
  },
  Lyra: {
    header: "🎯 Coach Lyra — Strategic · “Plan smart. Act boldly.”",
    sign: "— Coach Lyra",
    desc: "You are focused, clear, and pragmatic.",
  },
  Athena: {
    header: "🔥 Coach Athena — Transformational · “Wisdom is courage in action.”",
    sign: "— Coach Athena",
    desc: "You are wise, direct, and thought-provoking.",
  },
  Kora: {
    header: "⚡ Coach Kora — Directive · “No excuses — only progress.”",
    sign: "— Coach Kora",
    desc: "You are firm, disciplined, and no-nonsense.",
  },
};

const SYS = (
  coreTheme: string,
  coachStyle: string | undefined,
  mode: Mode
) => {
  const personaKey = coachStyle && personas[coachStyle] ? coachStyle : "Vera";
  const p = personas[personaKey];

  const base = `
${p.desc}

Ground every answer in Andrew's profile theme:
"${coreTheme}"

Always use Andrew’s name to make it personal.
`.trim();

  if (mode === "structured") {
    // Your exact structured format for the first response
    return `
${base}

FORMAT REQUIREMENTS (must follow exactly):
• Start your reply with this header on its own line: ${p.header}
• Then provide 3–5 concise, practical bullet points.
the coaches advice should reflect their persona style above.
The language for each of the bullet points should reflect and demonstrate influence from the coaches style above.
• Add a one-sentence “15-minute nudge” line that begins with: 15-minute nudge:
• End your reply with a signature line on its own line: ${p.sign}
`.trim();
  }

  // Follow-ups: a single paragraph, still persona-grounded
  return `
${base}

For follow-up clarifications, respond as one concise paragraph (no lists), with tone and language reflecting the coach persona above.
`.trim();
};

const VERSION = "ask-coach:2025-10-29-02"; // bump this whenever deployed

export default async function handler(req: any, res: any) {
  // --- CORS (for Expo web / localhost) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    if (req.method !== "POST") return res.status(405).send("Use POST");

    const { question, profile, coachStyle, formatMode } = (req.body ?? {}) as {
      question?: string;
      profile?: any;
      coachStyle?: string;
      formatMode?: Mode; // "structured" | "free"
    };
    if (!question || !profile) return res.status(400).send("Missing 'question' or 'profile'");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).send("OPENAI_API_KEY not set");

    const coreTheme =
      profile.coreTheme ||
      profile.theme ||
      "Focusing on both creative and tangible solutions";

    // Lightly curated profile context to keep prompt focused / compact
    const traits = Array.isArray(profile.keyTraits) ? profile.keyTraits.slice(0, 6) : [];
    const anchors = Array.isArray(profile.leadershipAnchors) ? profile.leadershipAnchors.slice(0, 5) : [];
    const cautions = Array.isArray(profile.cautionAreas) ? profile.cautionAreas.slice(0, 3) : [];

    const userContext = {
      coreTheme,
      motivations: profile.motivations,
      abilities: profile.abilities,
      personality: profile.personality,
      keyTraits: traits,
      leadershipAnchors: anchors,
      cautionAreas: cautions,
      educationKeys: profile.educationKeys,
    };

    const mode: Mode = formatMode === "free" ? "free" : "structured";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        // (Optional) you can add max_tokens if you want to cap length
        // max_tokens: 600,
        messages: [
          { role: "system", content: SYS(coreTheme, coachStyle, mode) },
          {
            role: "user",
            content: `Profile (JSON): ${JSON.stringify(userContext)}\n\nQuestion: ${question}`,
          },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(500).send(`OpenAI error ${resp.status}: ${JSON.stringify(data)}`);
    }

    const answer = data?.choices?.[0]?.message?.content ?? "No answer generated.";
    return res.status(200).json({
      answer,
      version: VERSION,
      mode,
      systemSnippet: SYS(coreTheme, coachStyle, mode).slice(0, 120),
    });
  } catch (e: any) {
    return res.status(500).send(`Server error: ${e?.message || e}`);
  }
}
