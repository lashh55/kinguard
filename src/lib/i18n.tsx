import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "es";

const DICT: Record<string, string> = {
  "Protecting the people you love": "Protegiendo a las personas que amas",
  "I want to be protected": "Quiero estar protegido/a",
  "🛡️ I want to be protected": "🛡️ Quiero estar protegido/a",
  "I want to protect someone": "Quiero proteger a alguien",
  "💙 I want to protect someone": "💙 Quiero proteger a alguien",
  "Caregiver Alerts": "Alertas para Cuidadores",
  "SSN Shield": "Protección del Número de Seguro Social",
  "AI Scam Detection": "Detección de Estafas con IA",
  "Knowledge Tree": "Árbol del Conocimiento",
  "Knowledge Tree 🌳": "Árbol del Conocimiento 🌳",
  "Blocked": "Bloqueado",
  "Checked": "Verificado",
  "Recent alerts": "Alertas Recientes",
  "Recent Alerts": "Alertas Recientes",
  "You're protected today": "Estás protegido/a hoy",
  "✅ No alerts yet. You're all clear!": "✅ Sin alertas. ¡Todo está bien!",
  "No alerts yet. You're all clear!": "Sin alertas. ¡Todo está bien!",
  "Sign in": "Iniciar sesión",
  "Sign In": "Iniciar sesión",
  "Learn": "Aprender",
  "Profile": "Perfil",
  "Check": "Verificar",
  "Home": "Inicio",
  "Already have an account?": "¿Ya tienes una cuenta?",
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string };
const I18nCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (s) => s });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kg_lang") as Lang | null;
      if (stored === "en" || stored === "es") setLangState(stored);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("kg_lang", l); } catch {}
  };

  const t = (s: string) => (lang === "es" ? DICT[s] ?? s : s);

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex rounded-full overflow-hidden border-2 ${className}`} style={{ borderColor: "var(--color-rose)" }}>
      <button
        type="button"
        onClick={() => setLang("en")}
        className="px-3 py-1 text-sm font-bold"
        style={{ background: lang === "en" ? "var(--color-rose)" : "transparent", color: lang === "en" ? "#fff" : "var(--color-rose)" }}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("es")}
        className="px-3 py-1 text-sm font-bold"
        style={{ background: lang === "es" ? "var(--color-rose)" : "transparent", color: lang === "es" ? "#fff" : "var(--color-rose)" }}
        aria-pressed={lang === "es"}
      >
        ES
      </button>
    </div>
  );
}
