import { Parser } from "htmlparser2";

export type ScamLink = { address: string; government_warning: boolean };
const governmentClaim = /\b(government|federal|medicare|social security|irs|ssa|gobierno|gubernamental|seguro social)\b|\.gov\b/i;

export function isGovernmentAddress(address: string): boolean {
  try { return new URL(address).hostname.toLowerCase().endsWith(".gov"); }
  catch { return false; }
}

export function inspectEmailLinks(content: string, html = ""): { text: string; links: ScamLink[] } {
  const found = new Map<string, ScamLink>();
  const add = (raw: string, claim: string) => {
    try {
      const url = new URL(raw.trim().startsWith("www.") ? `https://${raw.trim()}` : raw.trim());
      if (url.protocol !== "https:" && url.protocol !== "http:") return;
      const address = url.href;
      const government_warning = governmentClaim.test(claim) && !isGovernmentAddress(address);
      found.set(address, { address, government_warning: government_warning || (found.get(address)?.government_warning ?? false) });
    } catch { /* Invalid or relative destinations cannot be identified as full web addresses. */ }
  };
  let text = "";
  let anchor: { href: string; label: string } | undefined;
  const anchors: { href: string; label: string }[] = [];
  let hiddenDepth = 0;
  const parser = new Parser({
    onopentag(name, attrs) {
      if (name === "script" || name === "style") hiddenDepth++;
      if (!hiddenDepth && name === "a" && attrs.href) anchor = { href: attrs.href, label: "" };
      if (["p", "br", "div", "li"].includes(name)) text += "\n";
    },
    ontext(value) { if (!hiddenDepth) { text += value; if (anchor) anchor.label += value; } },
    onclosetag(name) {
      if (name === "a" && anchor) { anchors.push(anchor); anchor = undefined; }
      if (name === "script" || name === "style") hiddenDepth = Math.max(0, hiddenDepth - 1);
      if (["p", "div", "li"].includes(name)) text += "\n";
    },
  }, { decodeEntities: true });
  parser.write(html || (/<[a-z][\s\S]*>/i.test(content) ? content : ""));
  parser.end();
  const visible = text.trim() || content;
  for (const item of anchors) add(item.href, `${item.label} ${visible} ${content}`);
  const plain = /<[a-z][\s\S]*>/i.test(content) ? visible : `${content}\n${visible}`;
  for (const match of plain.matchAll(/(?:https?:\/\/|www\.)[^\s<>"']+/gi)) {
    add(match[0].replace(/[.,;!?)\]}]+$/, ""), `${visible} ${content}`);
  }
  return { text: visible, links: [...found.values()] };
}

export function seasonalWarnings(content: string) {
  const enrollment = /open enrollment|medicare plan|benefits card|free rebate|medical discount card|inscripci[oó]n abierta|plan de medicare|tarjeta de beneficios|reembolso gratis|tarjeta de descuento m[eé]dico/i.test(content);
  const sensitiveRequest = /(?:send|share|provide|enter|give|request|need|sign up|enroll|env[ií]e|comparta|proporcione|ingrese|d[eé]|solicit|necesit|inscr[ií]base|reg[ií]strese)[\s\S]{0,120}(?:medicare|social security|\bssn\b|bank|immediately|right now|seguro social|bancari|inmediatamente|ahora)|(?:medicare number|social security number|bank information|n[uú]mero de medicare|n[uú]mero de seguro social|informaci[oó]n bancaria)[\s\S]{0,80}(?:required|needed|requested|requerid|solicitad)|(?:immediate sign.?up|inscripci[oó]n inmediata)/i.test(content);
  const prize = /\b(prize|winner|won|winnings|sweepstakes|lottery|premio|ganador|gan[oó]|sorteo|loter[ií]a)\b/i.test(content);
  const fee = /\b(tax(?:es)?|shipping|processing|insurance|release fee|impuestos?|env[ií]o|procesamiento|seguro|liberaci[oó]n)\b/i.test(content);
  const paymentRequest = /\b(pay|payment|send|fee|cost|charge|owe|deposit|pague|pagar|pago|env[ií]e|tarifa|costo|cargo|deposite)\b/i.test(content);
  return { enrollment, sensitiveRequest, prizeFee: prize && fee && paymentRequest };
}

export function applySeasonalRules<T extends { score: number; urgency: "low" | "medium" | "high" | "critical"; flags: string[]; flags_es: string[] }>(result: T, content: string): Omit<T, "urgency"> & { urgency: "low" | "medium" | "high" | "critical" } {
  const signals = seasonalWarnings(content);
  const flags = [...result.flags];
  const flags_es = [...result.flags_es];
  const add = (en: string, es: string) => { flags.push(en); flags_es.push(es); };
  if (signals.enrollment) add("⚠️ Health-plan or Medicare enrollment wording: verify the offer through official sources.", "⚠️ Texto sobre inscripción en un plan de salud o Medicare: verifique la oferta con fuentes oficiales.");
  if (signals.sensitiveRequest) add("⚠️ Requests personal information or immediate sign-up. Do not share your Medicare number, Social Security number or bank information.", "⚠️ Pide información personal o inscripción inmediata. No comparta su número de Medicare, Seguro Social ni información bancaria.");
  if (signals.prizeFee) add("⚠️ Payment requested to receive a prize. A familiar company or charity name does not make it safe.", "⚠️ Pide un pago para recibir un premio. El nombre de una compañía o caridad conocida no lo hace seguro.");
  return { ...result, flags, flags_es, score: signals.prizeFee ? Math.max(75, result.score) : result.score,
    urgency: signals.prizeFee && result.urgency !== "critical" ? "high" : result.urgency };
}