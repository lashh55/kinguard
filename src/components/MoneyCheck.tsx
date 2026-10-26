import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const QUESTIONS: [string, string][] = [
  ["Did they ask for gift cards, a wire or bank transfer, cryptocurrency, or cash?", "¿Le pidieron tarjetas de regalo, una transferencia bancaria, criptomonedas o efectivo?"],
  ["Did they say it's urgent or that you'll be in trouble?", "¿Le dijeron que es urgente o que usted tendrá problemas?"],
  ["Did they ask you to keep it secret?", "¿Le pidieron que lo mantenga en secreto?"],
  ["Did they transfer you to \"police\" or another \"official,\" or threaten to shut off your phone?", "¿Lo transfirieron a la \"policía\" u otro \"funcionario\", o amenazaron con cortar su teléfono?"],
  ["Is it a large amount for you?", "¿Es una cantidad grande para usted?"],
];

/** Answers live only in component state; nothing is saved. */
export function MoneyCheck({ guardianCount }: { guardianCount: number }) {
  const { lang } = useI18n();
  const es = lang === "es";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [anyYes, setAnyYes] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const done = step >= QUESTIONS.length;

  const reset = () => { setOpen(false); setStep(0); setAnyYes(false); setSent(false); };
  const answer = (yes: boolean) => { if (yes) setAnyYes(true); setStep((s) => s + 1); };
  const askFamily = async () => {
    setSending(true);
    const { error } = await supabase.rpc("request_money_check");
    setSending(false);
    if (error) { toast.error(es ? "No se pudo enviar. Inténtelo de nuevo." : "Couldn't send. Please try again."); return; }
    setSent(true);
  };

  const btn = "btn-base w-full whitespace-normal h-auto";
  const amber = { background: "var(--money-amber)", color: "var(--color-brown)", minHeight: 64, fontSize: 20 };

  if (!open) return (
    <button type="button" className={`${btn} font-bold`} style={amber} onClick={() => setOpen(true)}>
      {es ? "Alguien me está pidiendo dinero" : "Someone is asking me for money"}
    </button>
  );

  return (
    <div className="card-soft space-y-4" style={{ borderTop: "6px solid var(--money-amber)" }} aria-live="polite">
      {!done ? (
        <>
          <p style={{ fontSize: 15, color: "var(--color-muted-foreground)" }}>{step + 1} / {QUESTIONS.length}</p>
          <p className="font-bold" style={{ fontSize: 24, lineHeight: 1.3 }}>{QUESTIONS[step][es ? 1 : 0]}</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={`${btn} btn-primary`} style={{ minHeight: 64, fontSize: 22 }} onClick={() => answer(true)}>{es ? "Sí" : "Yes"}</button>
            <button type="button" className={`${btn} btn-primary`} style={{ minHeight: 64, fontSize: 22 }} onClick={() => answer(false)}>No</button>
          </div>
        </>
      ) : anyYes ? (
        <>
          <p className="font-extrabold" style={{ fontSize: 24, lineHeight: 1.3 }}>{es ? "ALTO. Esto coincide con cómo funcionan las estafas. No envíe dinero." : "STOP. This matches how scams work. Do not send money."}</p>
          <p style={{ fontSize: 20 }}>{es ? "Termine el contacto. Busque el número real usted mismo. Confirme con alguien de confianza." : "End the contact. Find the real number yourself. Verify with someone you trust."}</p>
        </>
      ) : (
        <p className="font-bold" style={{ fontSize: 22 }}>{es ? "Revise de todos modos antes de pagar. Una llamada rápida a su familia siempre es buena idea." : "Still check before you pay. A quick call to family is always a good idea."}</p>
      )}

      {guardianCount === 0 ? (
        <p className="font-bold" style={{ fontSize: 20 }}>{es ? "Llame a alguien de confianza antes de pagar." : "Call someone you trust before paying."}</p>
      ) : sent ? (
        <p className="font-bold" role="status" style={{ fontSize: 20 }}>{es ? "✅ Le avisamos a su familia. Ellos le llamarán." : "✅ Your family was told. They will call you."}</p>
      ) : (
        <button type="button" className={`${btn} font-bold`} style={amber} disabled={sending} onClick={askFamily}>
          {es ? "Preguntar a mi familia" : "Ask my family"}
        </button>
      )}
      <button type="button" className="underline w-full" style={{ fontSize: 18 }} onClick={reset}>{es ? "Cerrar" : "Close"}</button>
    </div>
  );
}
