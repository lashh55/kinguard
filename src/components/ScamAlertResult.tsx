import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { scamTypeFor, recommendationFor } from "@/lib/scamLanguage";
import type { HandledScam } from "@/lib/scamStatus";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export type ScanAlert = HandledScam & {
  id: string;
  senior_id: string;
  scam_type: string | null;
  scam_type_es?: string | null;
  ai_recommendation?: string | null;
  ai_recommendation_es?: string | null;
  scam_score: number;
  created_at: string;
  senior_viewed_at?: string | null;
};
export type ScanReceipt = {
  alert_id: string;
  guardian_name: string;
  message: string | null;
  reply_key: string | null;
};
const replies = {
  looking: { en: "I'm looking into it.", es: "Lo estoy revisando." },
  call: { en: "I'll call you soon.", es: "Le llamaré pronto." },
  delete: { en: "Good catch. Just delete it.", es: "Bien hecho. Solo bórrelo." },
};

export function useScanReceipts(seniorId?: string) {
  const [receipts, setReceipts] = useState<ScanReceipt[]>([]);
  useEffect(() => {
    if (!seniorId) return;
    let alive = true;
    const load = async () => {
      const { data } = await supabase.from("scam_alert_receipts")
        .select("alert_id,guardian_name,message,reply_key").eq("senior_id", seniorId)
        .order("viewed_at", { ascending: false });
      if (alive && data) setReceipts(data);
    };
    void load();
    const ch = supabase.channel(`scan_receipts_${seniorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "scam_alert_receipts", filter: `senior_id=eq.${seniorId}` }, () => { void load(); }).subscribe();
    const timer = setInterval(load, 15000);
    return () => { alive = false; clearInterval(timer); void supabase.removeChannel(ch); };
  }, [seniorId]);
  return receipts;
}

export function GuardianScanStatus({ receipts }: { receipts: ScanReceipt[] }) {
  const { lang } = useI18n();
  if (!receipts.length) return null;
  return <div className="space-y-2" aria-live="polite">
    {receipts.map((r, i) => <div key={`${r.alert_id}-${i}`} className="rounded-lg border border-safe bg-safe/15 p-4 text-foreground">
      <p className="font-bold">{lang === "es" ? `✅ ${r.guardian_name} vio esta alerta.` : `✅ ${r.guardian_name} saw this alert.`}</p>
      {(r.message || r.reply_key) && <p className="mt-2 whitespace-pre-wrap break-words">{r.reply_key && r.reply_key in replies ? replies[r.reply_key as keyof typeof replies][lang] : r.message}</p>}
    </div>)}
  </div>;
}

function ScanDetails({ alert }: { alert: ScanAlert }) {
  const { lang } = useI18n();
  const es = lang === "es";
  return <div className="space-y-4 text-lg">
    <p className="font-bold break-words">{es ? "Qué era:" : "What it was:"} {scamTypeFor(alert, lang)}</p>
    <p className="font-bold">{es ? "Riesgo:" : "Risk:"} {alert.scam_score}/100</p>
    <p>{es ? "Qué hacer:" : "What to do:"} {recommendationFor(alert, lang)}</p>
  </div>;
}

export function ScamHandledStatus({ alert, guardian = false }: { alert: HandledScam; guardian?: boolean }) {
  const { lang } = useI18n();
  if (!alert.handled_at) return null;
  const name = alert.handled_by_name || (lang === "es" ? "Su guardián" : "Your guardian");
  return <div className="rounded-lg border border-safe bg-safe/15 p-4 text-foreground space-y-2" role="status">
    <p className="font-bold">{guardian
      ? (lang === "es" ? `${name} marcó esta alerta como resuelta.` : `${name} marked this alert as handled.`)
      : (lang === "es" ? `✅ ${name} marcó esto como resuelto. Todo está en orden.` : `✅ ${name} marked this as handled. You're all set.`)}</p>
    {alert.handled_note && <p className="whitespace-pre-wrap break-words">{alert.handled_note}</p>}
  </div>;
}

export function ScamAlertResult({ alert, receipts, onClose, onViewed }: {
  alert: ScanAlert; receipts: ScanReceipt[]; onClose: () => void; onViewed: (id: string, time: string) => void;
}) {
  const { lang } = useI18n();
  const [error, setError] = useState(false);
  useEffect(() => {
    // This runs only after the complete result has been rendered, never on banner dismissal.
    if (alert.senior_viewed_at) return;
    const time = new Date().toISOString();
    void supabase.from("scam_alerts").update({ senior_viewed_at: time })
      .eq("id", alert.id).eq("senior_id", alert.senior_id).select("id").single()
      .then(({ error }) => { if (error) setError(true); else onViewed(alert.id, time); });
  }, [alert.id]);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg bg-card">
      <DialogTitle className="text-2xl tracking-normal">{lang === "es" ? "Resultado de KinGuard" : "KinGuard scan result"}</DialogTitle>
      <DialogDescription>{new Date(alert.created_at).toLocaleString(lang === "es" ? "es" : "en")}</DialogDescription>
      <ScanDetails alert={alert} />
      <ScamHandledStatus alert={alert} />
      <GuardianScanStatus receipts={receipts} />
      {error && <p role="alert">{lang === "es" ? "No se pudo guardar. La alerta seguirá disponible." : "Could not save. Your alert will stay available."}</p>}
      <Button size="lg" className="min-h-14 text-lg" onClick={onClose}>{lang === "es" ? "Cerrar" : "Close"}</Button>
    </DialogContent>
  </Dialog>;
}

export function GuardianScamCard({ alert, seniorName, onHandled }: { alert: ScanAlert; seniorName: string; onHandled: (alert: ScanAlert) => void }) {
  const { lang } = useI18n();
  const ref = useRef<HTMLLIElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let sent = false;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting || document.visibilityState !== "visible" || sent) return;
      sent = true;
      const { error } = await supabase.rpc("record_scam_alert_view", { _alert_id: alert.id });
      if (error) sent = false;
    }, { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [alert.id]);
  const send = async (key?: keyof typeof replies) => {
    if (busy || (!key && !message.trim())) return;
    setBusy(true); setFeedback("");
    const { error } = await supabase.rpc("record_scam_alert_view", {
      _alert_id: alert.id, ...(key ? { _reply_key: key } : { _message: message }),
    });
    setBusy(false);
    setFeedback(error ? (lang === "es" ? "No se pudo enviar. Inténtelo de nuevo." : "Could not send. Please try again.") : (lang === "es" ? "Mensaje enviado." : "Message sent."));
    if (!error) setMessage("");
  };
  const handle = async () => {
    if (busy || alert.handled_at) return;
    setBusy(true); setFeedback("");
    const { data, error } = await supabase.rpc("mark_scam_alert_handled", { _alert_id: alert.id, _note: note });
    setBusy(false);
    if (error || !data) {
      setFeedback(lang === "es" ? "No se pudo guardar. Inténtelo de nuevo." : "Could not save. Please try again.");
      return;
    }
    onHandled(data);
    setNote("");
  };
  return <li ref={ref} className="rounded-lg border-2 border-danger bg-danger/10 p-4 space-y-4">
    <p className="font-bold text-danger">🚨 {seniorName}</p>
    <ScanDetails alert={alert} />
    <ScamHandledStatus alert={alert} guardian />
    <p className="text-sm text-muted-foreground">{new Date(alert.created_at).toLocaleString(lang === "es" ? "es" : "en")}</p>
    <div className="grid gap-2">
      {(Object.keys(replies) as (keyof typeof replies)[]).map((key) => <Button key={key} variant="outline" disabled={busy} onClick={() => send(key)} className="min-h-12 h-auto whitespace-normal text-base py-3">{replies[key][lang]}</Button>)}
    </div>
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void send(); }}>
      <label className="block text-base font-bold" htmlFor={`reply-${alert.id}`}>{lang === "es" ? "Mensaje opcional" : "Optional message"}</label>
      <textarea id={`reply-${alert.id}`} maxLength={150} rows={3} className="input-large" value={message} onChange={(e) => setMessage(e.target.value)} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{message.length}/150</span>
        <Button disabled={busy || !message.trim()} type="submit" className="min-h-12 text-base">{lang === "es" ? "Enviar" : "Send"}</Button>
      </div>
    </form>
    {!alert.handled_at && <form className="space-y-2 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); void handle(); }}>
      <label className="block text-base font-bold" htmlFor={`handled-note-${alert.id}`}>{lang === "es" ? "Nota opcional" : "Optional note"}</label>
      <textarea id={`handled-note-${alert.id}`} maxLength={150} rows={2} className="input-large" value={note} onChange={(e) => setNote(e.target.value)} />
      <span className="block text-sm text-muted-foreground">{note.length}/150</span>
      <Button disabled={busy} type="submit" className="w-full min-h-12 h-auto whitespace-normal text-base">{lang === "es" ? "Marcar como resuelto" : "Mark as handled"}</Button>
    </form>}
    {feedback && <p role="status" className="text-base">{feedback}</p>}
  </li>;
}