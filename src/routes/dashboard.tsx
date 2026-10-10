import { GuardianRequests, GuardianNotices, SeniorGuardianNotice } from "@/components/GuardianRequests";
import { pageHead } from "@/lib/pageHead";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ScreenShell } from "@/components/ScreenShell";
import { notifyGuardianSOS, notifyGuardianScam } from "@/lib/guardianAlerts";
import { normalizeStats } from "@/lib/badges";
import { Button } from "@/components/ui/button";
import { ScamAlertResult, GuardianScamCard, GuardianScanStatus, useScanReceipts } from "@/components/ScamAlertResult";
import alertsIcon from "@/assets/senior-alerts.webp.asset.json";
import checkedIcon from "@/assets/senior-checked.webp.asset.json";
import knowledgeTreeIcon from "@/assets/senior-knowledge-tree.webp.asset.json";
import allClearLogo from "@/assets/kinguard-all-clear.webp.asset.json";
import inboxIcon from "@/assets/kinguard-inbox.webp.asset.json";
import helpIcon from "@/assets/kinguard-help-people.webp.asset.json";
import { KinGuardShield } from "@/components/KinGuardIcon";
import { requestHelp, SOS_COLS, REALERT_MS, sosOverdue, fmtTime, helpRequestText, type SosEvent } from "@/lib/sos";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { SsnDisclaimer } from "@/components/SsnDisclaimer";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => pageHead("Your protection overview", "Review your KinGuard scam alerts, guardian connections, and protection activity."),
  component: Dashboard,
});

type Alert = {
  id: string;
  channel: string;
  scam_type: string | null;
  scam_score: number;
  content_preview: string | null;
  status: string;
  created_at: string;
  senior_id: string;
  senior_viewed_at?: string | null;
};

type Question = {
  id: string;
  question_text: string;
  answer_a: string; answer_b: string; answer_c: string; answer_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  explanation: string;
};

const TIPS = [
  "The IRS will NEVER call you to demand immediate payment.",
  "No real company will ask you to pay with gift cards.",
  "If they say ACT NOW — slow down. Scammers want you to panic.",
  "Your bank will never ask for your full password over the phone.",
  "When in doubt, hang up and call the number on your card or statement.",
  "You did NOT win a prize you never entered to win.",
  "Never give your Social Security Number to someone who contacted you first.",
];

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  if (!profile) return <div className="min-h-screen flex items-center justify-center">{t("Loading…")}</div>;

  return profile.role === "guardian" ? <GuardianDashboard /> : <SeniorDashboard />;
}

function SeniorDashboard() {
  const { user, profile } = useAuth();
  const { t, lang } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [guardianCount, setGuardianCount] = useState<number>(0);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const receipts = useScanReceipts(profile?.id);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [checkedOpen, setCheckedOpen] = useState(false);
  const inboxRef = useRef<HTMLElement>(null);
  const [lastSos, setLastSos] = useState<SosEvent | null>(null);
  const [sendingHelp, setSendingHelp] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("scam_alerts")
        .select("id,channel,scam_type,scam_score,content_preview,status,created_at,senior_id,senior_viewed_at")
        .eq("senior_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setAlerts((data as Alert[]) ?? []);
    })();
    (async () => {
      const weeks = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 14));
      const group = (weeks % 6) + 1;
      const { data } = await supabase
        .from("quiz_questions")
        .select("id,question_text,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation")
        .eq("rotation_group", group)
        .limit(1);
      if (data?.[0]) setQuestion(data[0] as Question);
    })();
    (async () => {
      const { data } = await supabase.rpc("get_my_guardians");
      setGuardianCount((data ?? []).length);
    })();
  }, [profile]);

  // Realtime: surface new alerts (e.g. from forwarded emails) instantly
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`scam_alerts_senior_${profile.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scam_alerts", filter: `senior_id=eq.${profile.id}` },
        (payload) => {
          const a = payload.new as Alert;
          setAlerts((prev) => [a, ...prev].slice(0, 100));

        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, t]);

  // Latest SOS + live "guardian saw your alert" updates
  useEffect(() => {
    if (!profile) return;
    supabase.from("sos_events").select(SOS_COLS)
      .eq("senior_id", profile.id).order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => {
        const s = data?.[0] as any;
        if (s && Date.now() - new Date(s.created_at).getTime() < 24 * 3600 * 1000) setLastSos(s);
      });
    const ch = supabase.channel(`sos_senior_${profile.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sos_events", filter: `senior_id=eq.${profile.id}` },
        (payload) => {
          const s = payload.new as any;
          setLastSos((prev) => {
            if (prev && prev.id !== s.id) return prev;
            if (s.acknowledged_at && !prev?.acknowledged_at) {
              toast(lang === "es" ? `${s.acknowledged_by_name || "Su guardián"} confirmó que usted está bien.` : `${s.acknowledged_by_name || "Your guardian"} marked you as OK.`, { duration: 10000 });
            } else if (s.claimed_by && !s.acknowledged_at && prev?.claimed_by !== s.claimed_by) {
              toast(lang === "es" ? `${s.claimed_by_name || "Su guardián"} se está comunicando con usted.` : `${s.claimed_by_name || "Your guardian"} is contacting you.`, { duration: 10000 });
            }
            return s;
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile, lang]);

  if (!profile) return null;

  const unreadAlerts = alerts.filter((a) => !a.senior_viewed_at);
  const unreadCount = unreadAlerts.length;
  const openAlert = (a: Alert) => setSelectedAlert(a);
  const markViewed = (id: string, time: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, senior_viewed_at: time } : a));
  };
  const latestReceiptAlert = alerts.find((a) => receipts.some((r) => r.alert_id === a.id));

  const tip = TIPS[new Date().getDay() % TIPS.length];
  const totalAlerts = alerts.length;
  const checked = alerts.length;

  const stats = normalizeStats(profile.challenge_stats);
  const streak = stats.current_streak_weeks;

  const choose = async (letter: "a"|"b"|"c"|"d") => {
    if (!question || picked) return;
    setPicked(letter);
    const wasCorrect = letter === question.correct_answer;
    track("quiz_answered", { question_id: question.id, was_correct: wasCorrect, source: "dashboard" });
    await supabase.from("quiz_attempts").insert({
      user_id: profile.id,
      question_id: question.id,
      was_correct: wasCorrect,
    });
  };

  return (
    <ScreenShell withPhotoPanel>
      <section className="px-5 pt-4">
        <SsnDisclaimer />
      </section>
      <header className="px-5 pt-4 pb-4">
        <h1>{lang === "es" ? "Hola" : "Hello"}, {profile.full_name.split(" ")[0]}</h1>
      </header>
      <GuardianRequests onChange={() => supabase.rpc("get_my_guardians").then(({ data }) => setGuardianCount((data ?? []).length))} />
      <SeniorGuardianNotice />

      {unreadCount > 0 && (
        <section className="px-5 mb-3">
          <Button variant="secondary" onClick={() => { const a = unreadAlerts[0]; if (a) openAlert(a); }}
            className="w-full h-auto min-h-20 whitespace-normal rounded-lg p-4 text-left justify-start text-lg font-bold">
            <KinGuardShield className="text-3xl" />
            <span>{lang === "es" ? "KinGuard detectó una posible estafa. Usted está a salvo. Toque para ver qué era." : "KinGuard caught a possible scam. You're safe. Tap to see what it was."}</span>
          </Button>
        </section>
      )}
      {unreadCount === 0 && (
        <section className="px-5 mb-3">
          <div className="overflow-hidden rounded-lg bg-secondary text-center pt-4" data-all-clear>
            <h2 className="font-extrabold">{t("All clear")}</h2>
            <img src={allClearLogo.url} alt="KinGuard — Protecting the people you love" width={370} height={456} className="block w-full max-h-80 object-contain" />
          </div>
        </section>
      )}
      {latestReceiptAlert && (
        <section className="px-5 mb-3">
          <GuardianScanStatus receipts={receipts.filter((r) => r.alert_id === latestReceiptAlert.id)} />
          <Button variant="link" className="text-foreground whitespace-normal" onClick={() => openAlert(latestReceiptAlert)}>
            {lang === "es" ? "Ver alerta:" : "View alert:"} {latestReceiptAlert.scam_type}
          </Button>
        </section>
      )}
      {selectedAlert && <ScamAlertResult key={selectedAlert.id} alert={selectedAlert}
        receipts={receipts.filter((r) => r.alert_id === selectedAlert.id)} onClose={() => setSelectedAlert(null)} onViewed={markViewed} />}
      <Dialog open={checkedOpen} onOpenChange={setCheckedOpen}>
        <DialogContent className="max-h-[80dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang === "es" ? "Mensajes revisados" : "Checked messages"}</DialogTitle>
            <DialogDescription className="sr-only">{lang === "es" ? "Resultados de sus mensajes revisados" : "Your checked message results"}</DialogDescription>
          </DialogHeader>
          {alerts.length === 0 ? <p>{lang === "es" ? "Aún no ha revisado mensajes." : "No messages checked yet."}</p> : (
            <ul className="space-y-2">{alerts.map((a) => <AlertCard key={a.id} a={a} onOpen={() => { setCheckedOpen(false); openAlert(a); }} />)}</ul>
          )}
        </DialogContent>
      </Dialog>

      <section className="px-5 mt-4">
        <div className="card-soft text-center" style={{ background: "var(--color-cream)" }}>
          {streak > 0
            ? <p className="font-bold" style={{ fontSize: 18 }}>🔥 {streak}{lang === "es" ? "-semanas de racha! ¡Sigue así!" : "-week streak! Keep it up!"}</p>
            : <p className="font-bold" style={{ fontSize: 18 }}>{t("Start a new streak this week! You've got this 💪")}</p>}
        </div>
      </section>

      <section className="px-5 mt-4 grid grid-cols-3 gap-2">
        <Stat icon={alertsIcon.url} label={t("Alerts")} value={totalAlerts} onClick={() => {
          setInboxOpen(true);
          requestAnimationFrame(() => inboxRef.current?.scrollIntoView({ behavior: "instant", block: "start" }));
        }} />
        <Stat icon={checkedIcon.url} label={lang === "es" ? "Revisados" : t("Checked")} value={checked} onClick={() => setCheckedOpen(true)} />
        <Button asChild variant="outline" className="h-auto min-w-0 flex-col justify-start gap-0 whitespace-normal rounded-lg bg-card p-3 text-foreground shadow-sm">
          <Link to="/learn" hash="knowledge-tree">
            <img src={knowledgeTreeIcon.url} alt="" width={48} height={48} className="size-12 shrink-0 object-contain" />
            <span className="mt-1 block text-xs text-muted-foreground">{t("Knowledge Tree")}</span>
          </Link>
        </Button>
      </section>

      <section ref={inboxRef} id="scam-alerts-inbox" className="px-5 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="flex items-center gap-2"><img src={inboxIcon.url} alt="" width={32} height={32} className="kinguard-inline-icon" /> {lang === "es" ? "Bandeja de alertas de estafas" : "Scam Alerts Inbox"}</h2>
          {alerts.length > 0 && (
            <button
              onClick={() => setInboxOpen((v) => !v)}
              className="text-sm font-bold underline"
              style={{ color: "var(--color-rose)" }}
            >
              {inboxOpen ? t("Hide") : `${t("Show all")} (${alerts.length})`}
            </button>
          )}
        </div>
        {alerts.length === 0 ? (
          <div className="card-soft text-center font-bold" style={{ color: "#2ECC71" }}>
            {t("✅ No alerts yet. You're all clear!")}
          </div>
        ) : (
          <ul className="space-y-2">
            {(inboxOpen ? alerts : alerts.slice(0, 3)).map((a) => (
              <AlertCard key={a.id} a={a} unread={!a.senior_viewed_at} onOpen={() => openAlert(a)} />
            ))}
          </ul>
        )}
      </section>

      <section className="px-5 mt-5 space-y-3">
        <Link to="/check" className="btn-base btn-primary w-full">🔍 {t("Check a Suspicious Message")}</Link>
        <Button asChild className="btn-base btn-primary w-full h-auto whitespace-normal"><Link to="/ssn"><KinGuardShield /> {t("Protect My SSN")}</Link></Button>
        <Button className="btn-base btn-danger w-full h-auto whitespace-normal" disabled={sendingHelp} onClick={async () => {
          if (guardianCount === 0) {
            toast(t("Please add a guardian before using SOS Alert."));
            return;
          }
          setSendingHelp(true);
          try {
            const { data, error } = await requestHelp();
            if (error) { toast.error(error.message); return; }
            track("help_requested");
            setLastSos(data);
            toast(lang === "es" ? "Su alerta fue enviada. Sus guardianes la verán en KinGuard." : "Your alert was sent. Your guardians will see it in KinGuard.", { duration: 8000 });
          } finally { setSendingHelp(false); }
        }}>
          <img src={helpIcon.url} alt="" width={28} height={28} className="kinguard-inline-icon" /> {lang === "es" ? "Necesito ayuda" : "I Need Help"}
        </Button>
        <p className="text-center" style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
          {t("In an emergency, call 911. KinGuard alerts your family. It is not an emergency service.")}
        </p>
        {lastSos && (
          <p className="text-center font-bold" role="status" style={{ fontSize: 17 }}>
            {lastSos.acknowledged_at
              ? (lang === "es"
                  ? `✅ ${lastSos.acknowledged_by_name || "Su guardián"} confirmó que usted está bien.`
                  : `✅ ${lastSos.acknowledged_by_name || "Your guardian"} marked you as OK.`)
              : lastSos.claimed_by
              ? (lang === "es"
                  ? `📞 ${lastSos.claimed_by_name || "Su guardián"} se está comunicando con usted.`
                  : `📞 ${lastSos.claimed_by_name || "Your guardian"} is contacting you.`)
              : (lang === "es" ? "Su alerta fue enviada. Sus guardianes la verán en KinGuard." : "Your alert was sent. Your guardians will see it in KinGuard.")}
          </p>
        )}
        {guardianCount === 0 && (
          <p className="text-sm text-center" style={{ color: "var(--color-muted-foreground)" }}>
            {t("Add a guardian in your profile to enable SOS Alert.")}
          </p>
        )}
      </section>

      {question && (
        <section className="px-5 mt-5">
          <div className="card-soft" style={{ background: "var(--color-cream)" }}>
            <p className="font-bold mb-1">{t("🧠 This Week's Question")}</p>
            <p className="font-bold" style={{ fontSize: 18 }}>{question.question_text}</p>
            <div className="mt-3 space-y-2">
              {(["a","b","c","d"] as const).map((l) => {
                const txt = question[`answer_${l}` as const];
                const isPicked = picked === l;
                const isCorrect = l === question.correct_answer;
                let style: React.CSSProperties = {};
                if (picked) {
                  if (isPicked && isCorrect) style = { background: "#2ECC71", color: "#fff" };
                  else if (isPicked && !isCorrect) style = { background: "#E74C3C", color: "#fff" };
                  else if (isCorrect) style = { background: "#2ECC71", color: "#fff", opacity: 0.85 };
                }
                return (
                  <button key={l} className="btn-base btn-sky w-full justify-start text-left" style={style} disabled={!!picked} onClick={() => choose(l)}>
                    <span className="font-extrabold mr-2">{l.toUpperCase()}.</span> {txt}
                  </button>
                );
              })}
            </div>
            {picked && (
              <p className="mt-3" style={{ fontSize: 16 }}>
                {picked === question.correct_answer ? `${t("✅ Correct!")} ` : `${t("❌ Not quite.")} `}
                {question.explanation}
              </p>
            )}
            <Link to="/learn" className="btn-base btn-outline w-full mt-3">{t("See All Questions")}</Link>
          </div>
        </section>
      )}

      <section className="px-5 mt-5">
        <div className="card-soft" style={{ background: "var(--color-sky)" }}>
          <p className="font-bold mb-1">{t("💡 Today's scam tip")}</p>
          <p>{tip}</p>
        </div>
      </section>
    </ScreenShell>
  );
}

type LinkedSenior = {
  id: string;
  full_name: string;
  invite_code: string | null;
  relationship_label: string | null;
  alertCount: number;
  lastAlert?: Alert;
  challenge_stats?: any;
};

function GuardianDashboard() {
  const { profile } = useAuth();
  const { lang } = useI18n();
  const es = lang === "es";
  const [seniors, setSeniors] = useState<LinkedSenior[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [seniorMap, setSeniorMap] = useState<Record<string, string>>({});
  const [sosEvents, setSosEvents] = useState<SosEvent[]>([]);

  // Guardian Alert (SOS) presses from linked seniors, live
  useEffect(() => {
    if (!profile) return;
    const load = () => supabase.from("sos_events")
      .select(SOS_COLS)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setSosEvents((data as SosEvent[]) ?? []));
    load();
    const poll = setInterval(load, 15000);
    const ch = supabase.channel(`sos_guardian_${profile.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sos_events" }, (p) => {
        const e = p.new as SosEvent;
        setSosEvents((prev) => [e, ...prev.filter((x) => x.id !== e.id)].slice(0, 10));
        notifyGuardianSOS(e.senior_first_name || (lang === "es" ? "Su ser querido" : "Your loved one"), lang);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sos_events" }, (p) => {
        const e = p.new as SosEvent;
        setSosEvents((prev) => prev.map((x) => {
          if (x.id !== e.id) return x;
          if (!e.acknowledged_at && e.urgent && !e.claimed_by && x.claimed_by) {
            const n = e.senior_first_name || (es ? "Su ser querido" : "Your loved one");
            toast.error(es
              ? `Recordatorio: ${e.unreached_by_name || "Un guardián"} no pudo comunicarse con ${n}. Por favor comuníquese ahora.`
              : `Reminder: ${e.unreached_by_name || "A guardian"} couldn't reach ${n}. Please contact them now.`, { id: `sos-reminder-${e.id}`, duration: 15000 });
          }
          if (e.claimed_by || e.acknowledged_at) toast.dismiss(`sos-reminder-${e.id}`);
          return { ...x, ...e };
        }));
      })
      .subscribe();
    return () => { clearInterval(poll); supabase.removeChannel(ch); };
  }, [profile]);

  // Re-alert every guardian when nobody has responded for 10 minutes
  const [nowTick, setNowTick] = useState(() => Date.now());
  const realerted = useRef<Set<string>>(new Set());
  useEffect(() => {
    const iv = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    for (const e of sosEvents) {
      if (!sosOverdue(e, nowTick)) continue;
      const bucket = Math.floor((nowTick - new Date(e.last_alerted_at || e.created_at).getTime()) / REALERT_MS);
      const key = `${e.id}:${e.last_alerted_at}:${bucket}`;
      if (realerted.current.has(key)) continue;
      realerted.current.add(key);
      const n = e.senior_first_name || (es ? "Su ser querido" : "Your loved one");
      toast.error(es
        ? `Recordatorio: Nadie ha respondido a la alerta de ${n}. Por favor comuníquese ahora.`
        : `Reminder: No one has responded to ${n}'s alert yet. Please contact them now.`, { id: `sos-reminder-${e.id}`, duration: 15000 });
    }
  }, [sosEvents, nowTick, es]);
  const [reload, setReload] = useState(0);
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeMsg, setRemoveMsg] = useState<string | null>(null);

  const addSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    if (code.length !== 6) { setLinkMsg({ ok: false, text: "Invite codes are 6 characters." }); return; }
    setLinking(true); setLinkMsg(null);
    const { error } = await supabase.rpc("link_guardian_by_code", { _code: code, _label: newLabel.trim() || "Family" });
    setLinking(false);
    if (error) {
      setLinkMsg({ ok: false, text: error.message.includes("Invalid") ? "That code didn't match anyone. Please check it and try again." : error.message });
      return;
    }
    try { (window as any).gtag?.("event", "guardian_linked"); } catch {}
    setNewCode(""); setNewLabel(""); setShowAdd(false);
    setLinkMsg({ ok: true, text: es ? "¡Vinculado! Ahora está protegiendo a su ser querido." : "Linked! You are now protecting your loved one." });
    setReload((r) => r + 1);
  };

  const removeSenior = async () => {
    if (!confirmRemove || !profile) return;
    setRemoving(true);
    const { error } = await supabase
      .from("guardian_relationships")
      .delete()
      .eq("guardian_id", profile.id)
      .eq("senior_id", confirmRemove.id);
    setRemoving(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      setConfirmRemove(null);
      return;
    }
    setRemoveMsg(`You are no longer protecting ${confirmRemove.name}.`);
    setConfirmRemove(null);
    setReload((r) => r + 1);
  };

  useEffect(() => {
    if (!profile) return;
    (async () => {
      // Privacy-safe lookup: returns only id, first_name, relationship_label
      const { data: linked } = await supabase.rpc("get_linked_seniors");
      const rows = (linked ?? []) as { id: string; first_name: string; relationship_label: string | null }[];
      const ids = rows.map((r) => r.id);
      if (!ids.length) { setSeniors([]); setRecentAlerts([]); return; }

      const nameMap: Record<string, string> = {};
      rows.forEach((r) => { nameMap[r.id] = r.first_name; });
      setSeniorMap(nameMap);

      const { data: alerts } = await supabase
        .from("scam_alerts")
        .select("id,channel,scam_type,scam_score,content_preview,status,created_at,senior_id,senior_viewed_at")
        .in("senior_id", ids)
        .order("created_at", { ascending: false })
        .limit(10);
      const allAlerts = (alerts ?? []) as Alert[];
      setRecentAlerts(allAlerts);

      // Mark this guardian as having checked alerts now
      await supabase
        .from("guardian_relationships")
        .update({ last_alert_view_at: new Date().toISOString() })
        .eq("guardian_id", profile.id)
        .eq("status", "active");

      // Log app_open for each linked senior
      const openRows = ids.map((sid) => ({
        guardian_id: profile.id,
        senior_id: sid,
        action_type: "app_open" as const,
      }));
      if (openRows.length) await supabase.from("guardian_activity").insert(openRows);

      const enriched: LinkedSenior[] = rows.map((r) => {
        const sa = allAlerts.filter((a) => a.senior_id === r.id);
        return {
          id: r.id,
          full_name: r.first_name,
          invite_code: null,
          relationship_label: r.relationship_label,
          alertCount: sa.filter((a) => a.status === "flagged").length,
          lastAlert: sa[0],
          challenge_stats: undefined,
        };
      });
      setSeniors(enriched);
    })();
  }, [profile, reload]);

  // Realtime: fan-out alerts from any linked senior (forwarded emails included)
  useEffect(() => {
    if (!profile) return;
    const linkedIds = Object.keys(seniorMap);
    if (linkedIds.length === 0) return;
    const channel = supabase
      .channel(`scam_alerts_guardian_${profile.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scam_alerts" },
        (payload) => {
          const a = payload.new as Alert;
          if (!linkedIds.includes(a.senior_id)) return;
          setRecentAlerts((prev) => [a, ...prev].slice(0, 10));
          setSeniors((prev) => prev.map((s) =>
            s.id === a.senior_id
              ? { ...s, alertCount: s.alertCount + (a.status === "flagged" ? 1 : 0), lastAlert: a }
              : s,
          ));
          notifyGuardianScam({
            seniorName: seniorMap[a.senior_id] || "Your loved one",
            scamType: a.scam_type || "Suspicious message",
            score: a.scam_score,
            channel: a.channel,
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, seniorMap]);

  if (!profile) return null;

  const me = profile.full_name.split(" ")[0];
  const claimSos = async (e: SosEvent) => {
    const { error } = await supabase.rpc("claim_sos", { _id: e.id });
    if (error) { toast.error(error.message); return; }
    toast.dismiss(`sos-reminder-${e.id}`);
    const { data } = await supabase.from("sos_events").select(SOS_COLS).eq("id", e.id).single();
    if (data) setSosEvents((prev) => prev.map((x) => x.id === e.id ? data as SosEvent : x));
  };
  const resolveSos = async (e: SosEvent, ok: boolean) => {
    const { error } = await supabase.rpc("resolve_sos", { _id: e.id, _ok: ok });
    if (error) { toast.error(error.message); return; }
    const now = new Date().toISOString();
    setSosEvents((prev) => prev.map((x) => (ok ? x.senior_id !== e.senior_id || !!x.acknowledged_at : x.id !== e.id) ? x : ok
      ? { ...x, acknowledged_at: now, acknowledged_by_name: me }
      : { ...x, claimed_by: null, claimed_by_name: null, claimed_at: null, helper_names: [], urgent: true, unreached_by_name: me, last_alerted_at: now }));
  };

  return (
    <ScreenShell withPhotoPanel>
      <header className="px-5 pt-6 pb-4">
        <h1>Hello, {profile.full_name.split(" ")[0]} 💙</h1>
        <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          You're protecting {seniors.length} {seniors.length === 1 ? "loved one" : "loved ones"}.
        </p>
      </header>
      <GuardianNotices />

      <section className="px-5">
        <h2 className="mb-2">You are protecting</h2>
        {seniors.length === 0 ? (
          <div className="card-soft text-center">
            <p className="font-bold mb-2">No one linked yet</p>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              Ask your loved one for their 6-character invite code, then tap "Protect a new senior" below.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {seniors.map((s) => (
              <li key={s.id} className="card-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold" style={{ fontSize: 19 }}>You are protecting: {s.full_name}</p>
                    <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{s.relationship_label || "Family"}</p>
                    <button
                      type="button"
                      className="mt-2 text-sm font-bold underline underline-offset-2"
                      style={{ color: "var(--color-muted-foreground)" }}
                      onClick={() => { setRemoveMsg(null); setConfirmRemove({ id: s.id, name: s.full_name }); }}
                    >
                      {es ? "Quitar" : "Remove"}
                    </button>
                  </div>
                  {sosEvents.some((e) => e.senior_id === s.id && !e.acknowledged_at) ? (
                    <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: "#E74C3C", color: "#fff" }}>🚨 {es ? "Alerta" : "Alert"}</span>
                  ) : s.alertCount > 0 ? (
                    <span className="badge-score-danger px-3 py-1 rounded-full text-sm font-bold">{s.alertCount} flagged</span>
                  ) : (
                    <span className="badge-score-safe px-3 py-1 rounded-full text-sm font-bold">All clear</span>
                  )}
                </div>
                {s.lastAlert && (
                  <p className="text-sm mt-3" style={{ color: "var(--color-muted-foreground)" }}>
                    Last alert: <span className="font-bold">{s.lastAlert.scam_type || "Suspicious message"}</span> · {timeAgo(s.lastAlert.created_at)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {removeMsg && (
          <p className="text-sm mt-2 font-bold" style={{ color: "var(--color-muted-foreground)" }}>{removeMsg}</p>
        )}

        <div className="card-soft mt-4">
          <button
            type="button"
            className="btn-base btn-primary w-full"
            disabled={seniors.length >= 3}
            aria-disabled={seniors.length >= 3}
            style={seniors.length >= 3 ? { opacity: 0.5, cursor: "not-allowed", filter: "grayscale(1)" } : undefined}
            onClick={() => { setShowAdd((v) => !v); setLinkMsg(null); }}
          >
            ➕ {es ? "Proteger a un nuevo adulto mayor" : "Protect a new senior"} ({seniors.length} {es ? "de" : "of"} 3)
          </button>
          {seniors.length >= 3 && (
            <p className="text-sm mt-2 text-center font-bold" style={{ color: "var(--color-muted-foreground)" }}>
              You are protecting the maximum of 3 seniors.
            </p>
          )}
          {showAdd && seniors.length < 3 && (
            <form onSubmit={addSenior} className="space-y-3 mt-3">
              <label className="block">
                <span className="block font-bold mb-1">{es ? "Código de invitación del adulto mayor" : "Senior's invite code"}</span>
                <input
                  className="input-large invite-code uppercase tracking-widest"
                  required
                  maxLength={6}
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                />
              </label>
              <label className="block">
                <span className="block font-bold mb-1">{es ? "Su relación (por ejemplo: hija, hijo, amigo)" : "Your relationship (e.g. Daughter, Son, Friend)"}</span>
                <input
                  className="input-large"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <button type="button" className="btn-base btn-outline flex-1" onClick={() => setShowAdd(false)}>{es ? "Cancelar" : "Cancel"}</button>
                <button type="submit" className="btn-base btn-primary flex-1" disabled={linking}>
                  {linking ? (es ? "Vinculando…" : "Linking…") : (es ? "Agregar adulto mayor" : "Add senior")}
                </button>
              </div>
            </form>
          )}
          {linkMsg && (
            <p className="text-sm mt-2 font-bold" style={{ color: linkMsg.ok ? "#2ECC71" : "var(--color-destructive)" }}>
              {linkMsg.text}
            </p>
          )}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="mb-2">{es ? "Alertas recientes" : "Recent alerts"}</h2>
        {sosEvents.length > 0 && (
          <ul className="space-y-2 mb-3" aria-live="polite">
            {sosEvents.map((e) => {
              const name = e.senior_first_name || seniorMap[e.senior_id] || (es ? "Su ser querido" : "Your loved one");
              const open = !e.acknowledged_at;
              const mine = e.claimed_by === profile.id;
              const helping = (e.helper_names ?? []).includes(me);
              const urgent = open && !e.claimed_by && (e.urgent || sosOverdue(e, nowTick));
              return (
                <li key={e.id} className="card-soft" style={{ background: open ? (urgent ? "#A93226" : "#E74C3C") : "#FDECEA", color: open ? "#fff" : "#7B1D14", border: urgent ? "4px solid #641E16" : "2px solid #C0392B" }}>
                  {urgent && (
                    <p className="font-extrabold mb-1" style={{ fontSize: 15, letterSpacing: 1 }}>
                      ⚠️ {es ? "URGENTE" : "URGENT"}
                      {e.unreached_by_name ? (es ? ` — ${e.unreached_by_name} no pudo comunicarse con ${name}` : ` — ${e.unreached_by_name} couldn't reach ${name}`) : (es ? " — nadie ha respondido todavía" : " — no one has responded yet")}
                    </p>
                  )}
                  <p className="font-extrabold" style={{ fontSize: 18 }}>
                    🚨 {helpRequestText(e, name, es)}
                  </p>
                  <p className="text-sm mt-1">{es ? "Enviada a las" : "Sent at"} {fmtTime(e.created_at)} · {timeAgo(e.created_at)}</p>
                  {open && e.claimed_by && (
                    <p className="mt-2 font-bold" role="status" style={{ fontSize: 16 }}>
                      📞 {mine
                        ? (es ? `Usted se está comunicando con ${name} — desde las ${fmtTime(e.claimed_at || e.created_at)}` : `You are contacting ${name} — started at ${fmtTime(e.claimed_at || e.created_at)}`)
                        : (es ? `${e.claimed_by_name} se está comunicando con ${name} — desde las ${fmtTime(e.claimed_at || e.created_at)}` : `${e.claimed_by_name} is contacting ${name} — started at ${fmtTime(e.claimed_at || e.created_at)}`)}
                    </p>
                  )}
                  {open && (e.helper_names?.length ?? 0) > 0 && (
                    <p className="text-sm mt-1">🤝 {es ? "También ayudan:" : "Also helping:"} {e.helper_names?.join(", ")}</p>
                  )}
                  {open ? (
                    mine ? (
                      <div className="grid gap-2 mt-3">
                        <button type="button" className="btn-base w-full" style={{ background: "#fff", color: "#1E8449" }} onClick={() => resolveSos(e, true)}>
                          ✅ {es ? `${name} está bien` : `${name} is OK`}
                        </button>
                        <button type="button" className="btn-base w-full" style={{ background: "#641E16", color: "#fff" }} onClick={() => resolveSos(e, false)}>
                          ❌ {es ? `No pude comunicarme con ${name}` : `I couldn't reach ${name}`}
                        </button>
                      </div>
                    ) : e.claimed_by ? (
                      helping ? (
                        <p className="text-sm mt-2 font-bold">🤝 {es ? "Usted también está ayudando." : "You're helping too."}</p>
                      ) : (
                        <button type="button" className="btn-base w-full mt-3" style={{ background: "#fff", color: "#C0392B" }} onClick={() => claimSos(e)}>
                          🤝 {es ? "Yo también ayudo" : "I'll help too"}
                        </button>
                      )
                    ) : (
                      <button type="button" className="btn-base w-full mt-3" style={{ background: "#fff", color: "#C0392B" }} onClick={() => claimSos(e)}>
                        📞 {es ? `Me estoy comunicando con ${name}` : `I'm contacting ${name}`}
                      </button>
                    )
                  ) : (
                    <p className="text-sm mt-2 font-bold">
                      ✅ {es ? `${e.acknowledged_by_name || "Un guardián"} confirmó que ${name} está bien — a las` : `${e.acknowledged_by_name || "A guardian"} marked ${name} as OK at`} {fmtTime(e.acknowledged_at || e.created_at)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {recentAlerts.length === 0 ? (
          <div className="card-soft text-center font-bold" style={{ color: "#2ECC71" }}>
            ✅ No alerts across your loved ones.
          </div>
        ) : (
          <ul className="space-y-2">
            {recentAlerts.slice(0, 5).map((a) => (
              <GuardianScamCard key={a.id} alert={a} seniorName={seniorMap[a.senior_id] || (es ? "Su ser querido" : "Your loved one")} />
            ))}
          </ul>
        )}
      </section>

      <section className="px-5 mt-6 mb-4">
        <Link to="/profile" className="btn-base btn-outline w-full">Manage my profile</Link>
      </section>

      {confirmRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(15, 23, 42, 0.6)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm removing senior"
          onClick={() => { if (!removing) setConfirmRemove(null); }}
        >
          <div
            className="card-soft w-full max-w-sm text-center"
            style={{ background: "var(--color-card, #fff)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-extrabold" style={{ fontSize: 20, color: "var(--color-destructive)" }}>
              {es ? `¿Dejar de proteger a ${confirmRemove.name}?` : `Stop protecting ${confirmRemove.name}?`}
            </p>
            <p className="mt-2 text-base">
              {es ? `¿Está seguro de que desea dejar de proteger a ${confirmRemove.name}?` : `Are you sure you want to stop protecting ${confirmRemove.name}?`}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="btn-base btn-outline flex-1"
                disabled={removing}
                onClick={() => setConfirmRemove(null)}
              >
                {es ? "Cancelar" : "Cancel"}
              </button>
              <button
                type="button"
                className="btn-base btn-primary flex-1"
                disabled={removing}
                style={{ background: "var(--color-destructive)", borderColor: "var(--color-destructive)" }}
                onClick={removeSenior}
              >
                {removing ? (es ? "Quitando…" : "Removing…") : (es ? "Quitar" : "Remove")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl py-2" style={{ background: "var(--color-cream)" }}>
      <p className="font-extrabold" style={{ fontSize: 18 }}>{value}</p>
      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{label}</p>
    </div>
  );
}

function channelIcon(channel: string) {
  return channel === "ssn_request" ? <KinGuardShield /> : (channel === "email" || channel === "email_forward") ? "📧" : channel === "sms" ? "📱" : channel === "call" ? "📞" : "🔍";
}

function Stat({ icon, label, value, onClick }: { icon: string; label: string; value: React.ReactNode; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} className="h-auto min-w-0 flex-col justify-start gap-0 whitespace-normal rounded-lg bg-card p-3 text-foreground shadow-sm">
      <img src={icon} alt="" width={48} height={48} className="size-12 shrink-0 object-contain" />
      <span className="block text-[22px] font-extrabold">{value}</span>
      <span className="block text-xs text-muted-foreground">{label}</span>
    </Button>
  );
}

function AlertCard({ a, unread, onOpen }: { a: Alert; unread?: boolean; onOpen: () => void }) {
  const { lang } = useI18n();
  return <li>
    <Button variant="outline" onClick={onOpen} className={`w-full h-auto whitespace-normal text-left justify-start p-4 text-base rounded-lg ${unread ? "border-2 border-sky bg-secondary" : "bg-card"}`}>
      <KinGuardShield className="text-2xl" />
      <span className="min-w-0 flex-1">
        <span className="block font-bold break-words">{a.scam_type || (lang === "es" ? "Mensaje sospechoso" : "Suspicious message")}</span>
        <span className="block text-sm">{lang === "es" ? "Riesgo:" : "Risk:"} {a.scam_score}/100</span>
        <span className="block text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString(lang === "es" ? "es" : "en")}</span>
      </span>
    </Button>
  </li>;
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}
