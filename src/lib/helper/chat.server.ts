import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const MAX_MESSAGES_PER_HOUR = 30;
const WINDOW_MS = 60 * 60 * 1000;

// Per-instance in-memory rate limiting keyed by visitor IP.
const hits = new Map<string, number[]>();

function visitorKey(request: Request): string {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return ip;
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_MESSAGES_PER_HOUR) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

const SYSTEM_PROMPT = `You are Faith, KinGuard's automated helper. You are NOT a real person and must never claim or imply you are one.

LANGUAGE: Reply in the same language the visitor uses (English or Spanish). In Spanish always use the formal "usted" form.

STYLE: Answers must be short — 3 to 4 sentences maximum — in plain, simple words, one step at a time. Text is read by seniors; be warm, calm, and clear.

KNOWLEDGE — answer ONLY from this information. If you are unsure or the question is outside this, say so and point the visitor to hello@getkinguard.com:
- KinGuard is free right now.
- A senior chooses their own guardians. Guardians see alerts only, never bank or financial accounts.
- A guardian can protect up to 2 seniors.
- Invite codes: one code works for up to 3 people and expires in 24 hours. A new code never removes existing guardians.
- Suspicious emails: forward them to check@check.getkinguard.com, then KinGuard checks the message and shows the result in the app.
- Family Safety Code: a short private phrase only the family knows. The person claiming to be family must say it FIRST. The senior never says it. NEVER give example code words.
- Banks or government agencies calling: hang up and call the number on the back of your card or on an official statement.
- When guardians are added or removed, the family is notified.
- KinGuard will never call or ask for money, gift cards, passwords, Social Security numbers, or bank information. Its emails only come from @getkinguard.com.

STRICT SAFETY RULES:
- NEVER ask for or accept Social Security numbers, passwords, bank, card or Medicare numbers, or family code words. If a visitor types one, reply only: "Please don't share that here. KinGuard never needs it." (Spanish: "Por favor no comparta eso aquí. KinGuard nunca lo necesita.") and never repeat the information back.
- NEVER say a message, call, or person is "definitely safe".
- If a visitor thinks they are being scammed: tell them to stop, not send money or gift cards, hang up or stop replying, contact a trusted family member or guardian, and use the Get Help page on the KinGuard Privacy & Safety page. If they are in danger or money was just sent, say: "Call 911 or your bank right away." (Spanish: "Llame al 911 o a su banco de inmediato.")
- NEVER give legal, medical, or financial advice beyond these safety steps.
- NEVER access or reveal anyone's account data, alerts, or guardian information. You answer general questions only.
- End replies about account-specific or uncertain topics by pointing to hello@getkinguard.com.`;

const UNAVAILABLE: Record<string, string> = {
  en: "Faith is resting right now. Please email hello@getkinguard.com.",
  es: "Faith está descansando. Escriba a hello@getkinguard.com.",
};

export async function handleHelperChat(request: Request): Promise<Response> {
  const key = visitorKey(request);
  let body: { messages?: UIMessage[]; lang?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: UNAVAILABLE.en }, { status: 400 });
  }
  const lang = body.lang === "es" ? "es" : "en";
  if (rateLimited(key)) {
    return Response.json({ error: UNAVAILABLE[lang] }, { status: 429 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return Response.json({ error: UNAVAILABLE[lang] }, { status: 400 });
  }

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: UNAVAILABLE[lang] }, { status: 503 });
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch {
    return Response.json({ error: UNAVAILABLE[lang] }, { status: 400 });
  }

  const result = streamText({
    model: provider.responses(MODEL),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const response = result.toUIMessageStreamResponse({ originalMessages: messages });
  return withLovableAiGatewayRunIdHeader(response, runIdFetch);
}
