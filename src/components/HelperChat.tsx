import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import faithAvatar from "@/assets/helper/faith-avatar.png.asset.json";

const STRINGS = {
  en: {
    needHelp: "Need help?",
    close: "Close",
    automated: "Automated helper · not a live person",
    greeting: "Hi, I'm Faith, KinGuard's automated helper. How can I help you today?",
    neverAsk:
      "KinGuard will never ask for your Social Security number, passwords, bank information, or family code word.",
    footer: "Need a real person? Email hello@getkinguard.com",
    placeholder: "Type your question…",
    send: "Send",
    thinking: "Faith is typing…",
    unavailable: "Faith is resting right now. Please email hello@getkinguard.com.",
    startersSenior: [
      "How do I add family?",
      "How do I check a suspicious email?",
      "What is the Family Safety Code?",
      "I think I'm being scammed",
    ],
    startersOther: [
      "How do I connect with my parent?",
      "How do invite codes work?",
      "Is KinGuard free?",
      "How do I set up an account?",
    ],
  },
  es: {
    needHelp: "¿Necesita ayuda?",
    close: "Cerrar",
    automated: "Asistente automático · no es una persona",
    greeting: "Hola, soy Faith, la asistente automática de KinGuard. ¿Cómo puedo ayudarle hoy?",
    neverAsk:
      "KinGuard nunca le pedirá su número de Seguro Social, contraseñas, información bancaria ni su palabra clave familiar.",
    footer: "¿Necesita hablar con una persona? Escriba a hello@getkinguard.com",
    placeholder: "Escriba su pregunta…",
    send: "Enviar",
    thinking: "Faith está escribiendo…",
    unavailable: "Faith está descansando. Escriba a hello@getkinguard.com.",
    startersSenior: [
      "¿Cómo agrego a mi familia?",
      "¿Cómo reviso un correo sospechoso?",
      "¿Qué es la palabra clave familiar?",
      "Creo que me están estafando",
    ],
    startersOther: [
      "¿Cómo me conecto con mi padre o madre?",
      "¿Cómo funcionan los códigos de invitación?",
      "¿KinGuard es gratis?",
      "¿Cómo creo una cuenta?",
    ],
  },
} as const;

export function HelperChat() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const s = STRINGS[lang === "es" ? "es" : "en"];
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setSession((n) => n + 1); // fresh chat each time it opens
        }}
        aria-label={s.needHelp}
        className="fixed right-4 z-40 flex items-center gap-2 rounded-full pr-4 pl-1 py-1 shadow-lg"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 104px)", background: "#fff", border: "3px solid var(--color-tan)", minHeight: 64 }}
      >
        <img src={faithAvatar.url} alt="" aria-hidden="true" width={52} height={52} className="rounded-full" />
        <span className="font-bold" style={{ color: "var(--color-brown)", fontSize: 18 }}>{s.needHelp}</span>
      </button>
      {open && <HelperPanel key={session} onClose={() => setOpen(false)} />}
    </>
  );
}

function HelperPanel({ onClose }: { onClose: () => void }) {
  const { lang } = useI18n();
  const { profile } = useAuth();
  const es = lang === "es";
  const s = STRINGS[es ? "es" : "en"];
  const starters = profile?.role === "senior" ? s.startersSenior : s.startersOther;

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/helper-chat", body: { lang: es ? "es" : "en" } }),
  });
  const busy = status === "submitted" || status === "streaming";

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  return (
    <div
      role="dialog"
      aria-label={s.needHelp}
      className="fixed inset-0 sm:inset-auto sm:right-4 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] z-50 flex flex-col bg-background"
      style={{ bottom: undefined, top: undefined, ...(typeof window !== "undefined" ? {} : {}) }}
      // full screen on phones via inset-0; panel on larger screens
      ref={undefined}
    >
      <style>{`@media (min-width: 640px) { .kg-helper-panel { bottom: calc(env(safe-area-inset-bottom, 0px) + 100px); height: min(70vh, 640px); border-radius: 1.25rem; border: 2px solid var(--color-border); box-shadow: 0 12px 40px -12px rgba(61,43,43,0.35); } }`}</style>
      <div className="kg-helper-panel absolute inset-0 flex flex-col bg-background">
        <header className="flex items-center gap-3 p-3 border-b" style={{ background: "var(--color-sky)" }}>
          <img src={faithAvatar.url} alt="" aria-hidden="true" width={56} height={56} className="rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold" style={{ color: "var(--color-brown)", fontSize: 20 }}>Faith</p>
            <p style={{ color: "var(--color-brown)", fontSize: 14 }}>{s.automated}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-base btn-outline"
            style={{ minHeight: 48, padding: "8px 16px", fontSize: 18 }}
          >
            {s.close}
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ fontSize: 20, lineHeight: 1.45 }}>
          <p className="rounded-2xl p-3 font-bold" style={{ background: "color-mix(in oklab, #E74C3C 12%, #fff)", color: "var(--color-brown)", fontSize: 16 }}>
            🛡️ {s.neverAsk}
          </p>
          <HelperBubble text={s.greeting} />

          {messages.length === 0 && (
            <div className="flex flex-col gap-2">
              {starters.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="btn-base btn-sky text-left"
                  style={{ minHeight: 52, justifyContent: "flex-start", fontSize: 18, padding: "12px 16px" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <div className="rounded-2xl p-3 max-w-[85%] font-bold" style={{ background: "var(--color-tan)", color: "var(--color-brown)" }}>
                  {m.parts.filter((p) => p.type === "text").map((p, i) => <span key={i}>{p.text}</span>)}
                </div>
              ) : (
                <div className="max-w-[92%]" style={{ color: "var(--color-brown)" }}>
                  {m.parts.map((p, i) =>
                    p.type === "text" ? (
                      <div key={i} className="prose prose-lg" style={{ fontSize: 20 }}>
                        <ReactMarkdown>{p.text}</ReactMarkdown>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          ))}

          {busy && <p style={{ color: "var(--color-muted-foreground)", fontSize: 18 }}>{s.thinking}</p>}
          {error && (
            <p className="rounded-2xl p-3 font-bold" style={{ background: "color-mix(in oklab, #F39C12 18%, #fff)", color: "var(--color-brown)", fontSize: 18 }}>
              {s.unavailable}
            </p>
          )}
        </div>

        <form
          className="flex gap-2 p-3 border-t"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={s.placeholder}
            className="input-large flex-1"
            style={{ fontSize: 20 }}
            maxLength={500}
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn-base btn-primary" style={{ minHeight: 56, padding: "12px 18px", fontSize: 20 }}>
            {s.send}
          </button>
        </form>
        <p className="text-center pb-3 px-3" style={{ fontSize: 14, color: "var(--color-muted-foreground)" }}>{s.footer}</p>
      </div>
    </div>
  );
}

function HelperBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <img src={faithAvatar.url} alt="" aria-hidden="true" width={36} height={36} className="rounded-full flex-shrink-0 mt-1" />
      <div className="rounded-2xl p-3" style={{ background: "var(--color-sky)", color: "var(--color-brown)" }}>
        {text}
      </div>
    </div>
  );
}
