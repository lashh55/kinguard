export type BilingualScam = {
  scam_type?: string | null;
  scam_type_es?: string | null;
  ai_recommendation?: string | null;
  ai_recommendation_es?: string | null;
};

export function scamTypeFor(alert: BilingualScam, lang: "en" | "es") {
  return (lang === "es" ? alert.scam_type_es : alert.scam_type) ||
    (lang === "es" ? "Mensaje sospechoso" : "Suspicious message");
}

export function recommendationFor(alert: BilingualScam, lang: "en" | "es") {
  return (lang === "es" ? alert.ai_recommendation_es : alert.ai_recommendation) ||
    (lang === "es"
      ? "No responda, no haga clic en ningún enlace y no envíe dinero. Puede borrarlo."
      : "Don't reply, don't click any links, and don't send money. You can delete it.");
}

export function flaggedCount(count: number, lang: "en" | "es") {
  return `${count} ${lang === "es" ? (count === 1 ? "marcada" : "marcadas") : "flagged"}`;
}