// Server-only helper: shared Claude scam analysis.
// Used by the in-app analyzeScam server fn and by the inbound email webhook.

export type AnalysisResult = {
  score: number;
  type: string;
  flags: string[];
  recommendation: string;
  urgency: "low" | "medium" | "high" | "critical";
  ssn_requested: boolean;
};

const SYSTEM_PROMPT = `You are KinGuard, a warm and trustworthy scam protection assistant for seniors. Analyze the provided content and return ONLY valid JSON with no extra text, no markdown, no backticks:
{ "score": integer 0-100 (scam likelihood), "type": string (scam category, e.g. IRS Impersonation), "flags": array of strings (each red flag in plain language, starting with a warning emoji), "recommendation": string (1-2 sentences, warm and clear, written for a 70-year-old, tell them exactly what to do), "urgency": one of: "low", "medium", "high", "critical", "ssn_requested": boolean (true if the message asks for a Social Security Number) }`;

export async function analyzeScamServer(
  content: string,
  channel: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const userMsg = `Channel: ${channel}\n\nContent:\n${content}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Claude API error", res.status, t);
    throw new Error(`AI analysis failed (${res.status})`);
  }

  const json = await res.json();
  const text: string = json?.content?.[0]?.text ?? "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI returned invalid JSON");
    parsed = JSON.parse(m[0]);
  }
  return {
    score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
    type: String(parsed.type || "Unknown"),
    flags: Array.isArray(parsed.flags) ? parsed.flags.map(String) : [],
    recommendation: String(parsed.recommendation || ""),
    urgency: (["low", "medium", "high", "critical"].includes(parsed.urgency)
      ? parsed.urgency
      : "low") as AnalysisResult["urgency"],
    ssn_requested: Boolean(parsed.ssn_requested),
  };
}
