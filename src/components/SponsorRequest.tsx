import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type Answer = "yes" | "no" | "not_sure";

export function SponsorRequestCard() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const es = lang === "es";
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [trusted, setTrusted] = useState<Answer | null>(null);
  const [heard, setHeard] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("sponsor_requests").select("id").eq("senior_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setDone(true); });
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !trusted || !heard.trim()) {
      setErr(es ? "Por favor responda las dos preguntas." : "Please answer both questions.");
      return;
    }
    setBusy(true); setErr(null);
    const { error } = await supabase.from("sponsor_requests").insert({
      senior_id: user.id, has_trusted_person: trusted, heard_about: heard.trim().slice(0, 300),
    });
    setBusy(false);
    if (error && !/duplicate/i.test(error.message)) { setErr(es ? "Algo salió mal. Inténtelo de nuevo." : "Something went wrong. Please try again."); return; }
    setDone(true);
  };

  const choice = (val: Answer | null, set: (a: Answer) => void, opts: [Answer, string][]) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {opts.map(([v, label]) => (
        <button key={v} type="button" aria-pressed={val === v} onClick={() => set(v)}
          className={`btn-base flex-1 ${val === v ? "btn-sky" : "btn-outline"}`}>{label}</button>
      ))}
    </div>
  );

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#E6F1F6", border: "2px solid #B3CFDA" }}>
      {done ? (
        <p className="font-bold" style={{ color: "var(--color-brown)", fontSize: 18 }}>
          {es
            ? "Gracias. Usted está en nuestra lista. Los planes patrocinados comienzan cuando lancemos nuestras nuevas funciones de protección. Le avisaremos cuando el suyo esté listo."
            : "Thank you. You're on our list. Sponsored plans begin when our new protection features launch. We'll let you know when yours is ready."}
        </p>
      ) : (
        <>
          <p className="font-bold" style={{ color: "var(--color-brown)", fontSize: 18 }}>
            {es
              ? "¿No tiene familiares que le ayuden con el costo de KinGuard? Podría calificar para un plan patrocinado gratuito. Usted seguirá eligiendo a alguien de confianza, como un vecino, alguien de su iglesia o un amigo, como su guardián."
              : "No family to help with the cost of KinGuard? You may qualify for a free sponsored plan. You'll still choose someone you trust, like a neighbor, church member, or friend, as your guardian."}
          </p>
          {!open ? (
            <button type="button" className="btn-base btn-sky w-full" onClick={() => setOpen(true)}>
              {es ? "Solicitar un plan patrocinado" : "Request a sponsored plan"}
            </button>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <p className="font-bold">{es
                  ? "¿Hay alguien de confianza que pueda ser su guardián, como un vecino, alguien de su iglesia o un amigo?"
                  : "Is there someone you trust who could be your guardian, like a neighbor, church member, or friend?"}</p>
                {choice(trusted, setTrusted, [["yes", es ? "Sí" : "Yes"], ["no", "No"], ["not_sure", es ? "No estoy seguro/a" : "Not sure"]])}
              </div>
              <label className="block">
                <span className="block font-bold mb-2">{es ? "¿Cómo se enteró de KinGuard?" : "How did you hear about KinGuard?"}</span>
                <input className="input-large" maxLength={300} value={heard} onChange={(e) => setHeard(e.target.value)} />
              </label>
              {err && <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
              <button className="btn-base btn-primary w-full" disabled={busy}>
                {busy ? (es ? "Enviando…" : "Sending…") : (es ? "Solicitar un plan patrocinado" : "Request a sponsored plan")}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
