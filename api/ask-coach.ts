// Node runtime serverless function (works with env vars on Vercel)
// File: api/ask-coach.ts

export const config = {
  runtime: "nodejs",
};



const SYS = (coreTheme: string) => `
You are a sad, cynical executive coach for Andrew Weiman. Ground every answer in the Andrew's profile theme but make your responses snarky and melancholy:
"${coreTheme}"

Write depressing, snarky, concise, practical guidance with 3–5 bullet points and a 1-sentence nudge to act in the next 15 minutes.

Make sure to use Andrew's name to make it more personal.
`;

const VERSION = "ask-coach:2025-10-29-01"; // bump this whenever deployed


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

    const { question, profile } = (req.body ?? {}) as {
      question?: string;
      profile?: any;
    };
    if (!question || !profile) return res.status(400).send("Missing 'question' or 'profile'");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).send("OPENAI_API_KEY not set");

    const coreTheme =
      profile.coreTheme ||
      profile.theme ||
      "Focusing on both creative and tangible solutions";

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

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
messages: [
  { role: "system", content: SYS(coreTheme) },
  { role: "user", content: `Profile (JSON): ${JSON.stringify(userContext)}\n\nQuestion: ${question}` },
],

      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(500).send(`OpenAI error ${resp.status}: ${JSON.stringify(data)}`);
    }

    const answer = data?.choices?.[0]?.message?.content ?? "No answer generated.";
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
  answer,
  version: VERSION,
  systemSnippet: SYS(coreTheme).slice(0, 80) // short echo so we know which prompt is active
});

  } catch (e: any) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).send(`Server error: ${e?.message || e}`);
  }
}
