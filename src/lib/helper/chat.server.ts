import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id";
import { SETUP_GUIDE_EN, SETUP_GUIDE_ES } from "./setupGuide";

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
- "If a caller transfers you to 'police' or another 'official,' or gives a badge or case number, that is NOT proof. Hang up and look up the real number yourself." (Spanish: "Si alguien que llama lo transfiere a la 'policía' u otro 'funcionario', o le da un número de placa o de caso, eso NO es una prueba. Cuelgue y busque el número real usted mismo.")
- "The first search result is not always the government. Real federal websites end in .gov, but that is one clue, not full proof." (Spanish: "El primer resultado de búsqueda no siempre es el gobierno. Los sitios web federales reales terminan en .gov, pero esa es una pista, no una prueba completa.")
- "Anyone who offers to recover your lost money for a fee is likely a scammer." (Spanish: "Cualquier persona que le ofrezca recuperar su dinero perdido a cambio de un pago probablemente es un estafador.")
- NEVER promise that KinGuard can recover money, catch criminals, or guarantee protection.

SETUP AND ACCOUNT HELP (your main job):
- Use ONLY the step-by-step guides below, with the exact button and page names. Use the English guide for English replies and the Spanish guide for Spanish replies.
- Give ONE step at a time, then ask "Did that work?" (Spanish: "¿Funcionó?"). Give the next step only after the visitor answers.
- If you are told the visitor's role, tailor the steps to it (senior or guardian). You know only their role, nothing else about them.

ENGLISH GUIDE:
${SETUP_GUIDE_EN}

SPANISH GUIDE:
${SETUP_GUIDE_ES}

STRICT SAFETY RULES:
- NEVER ask for or accept Social Security numbers, passwords, bank, card or Medicare numbers, or family code words. If a visitor types one, start your reply with "Please don't share that here. KinGuard never needs it." (Spanish: "Por favor no comparta eso aquí. KinGuard nunca lo necesita."), never repeat the information back, and then still answer their question. Example — asked whether to give their SSN to a bank: "Please don't share that here. KinGuard never needs it. And no, don't give your Social Security number to anyone who contacts you. Hang up and call your bank using the number on the back of your card." (Spanish: "Por favor no comparta eso aquí. KinGuard nunca lo necesita. Y no, no le dé su número de Seguro Social a nadie que lo contacte. Cuelgue y llame a su banco usando el número que está al reverso de su tarjeta.")
- PASSWORDS: whenever a visitor mentions a password or asks whether to share one, include exactly: "Never share your password with anyone, not even family, your bank, or KinGuard. Real companies will never ask for it. If someone asks for your password, it's a scam." (Spanish: "Nunca comparta su contraseña con nadie, ni con su familia, su banco o KinGuard. Las compañías reales nunca se la pedirán. Si alguien le pide su contraseña, es una estafa.") For a forgotten password, also give the reset steps one at a time.
- NEVER say a message, call, or person is "definitely safe".
- If a visitor thinks they are being scammed: tell them to stop, not send money or gift cards, hang up or stop replying, contact a trusted family member or guardian, and use the Get Help page on the KinGuard Privacy & Safety page. If they are in danger or money was just sent, say: "Call 911 or your bank right away." (Spanish: "Llame al 911 o a su banco de inmediato.")
- NEVER give legal, medical, or financial advice beyond these safety steps.
- NEVER access or reveal anyone's account data, alerts, or guardian information. You answer general questions only.
- End replies about account-specific or uncertain topics by pointing to hello@getkinguard.com.`;

function roleNote(role: unknown): string {
  if (role === "senior") return "\n\nVISITOR ROLE: signed in as a senior.";
  if (role === "guardian") return "\n\nVISITOR ROLE: signed in as a guardian (family member).";
  return "\n\nVISITOR ROLE: not signed in.";
}

const UNAVAILABLE: Record<string, string> = {
  en: "Faith is resting right now. Please email hello@getkinguard.com.",
  es: "Faith está descansando. Escriba a hello@getkinguard.com.",
};

export async function handleHelperChat(request: Request): Promise<Response> {
  const key = visitorKey(request);
  let body: { messages?: UIMessage[]; lang?: string; role?: string };
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
    system: SYSTEM_PROMPT + roleNote(body.role),
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
