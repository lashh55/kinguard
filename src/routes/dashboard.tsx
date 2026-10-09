import { NeverNotice } from "@/components/NeverNotice";
import { GuardianRequests, GuardianNotices, SeniorGuardianNotice } from "@/components/GuardianRequests";
import { pageHead } from "@/lib/pageHead";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ScreenShell, ScoreBadge } from "@/components/ScreenShell";
import { notifyGuardianSOS, notifyGuardianScam } from "@/lib/guardianAlerts";
import { normalizeStats } from "@/lib/badges";
import logo from "@/assets/kinguard-logo.png";
import { LearningTree } from "@/components/LearningTree";
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

type SosEvent = {
  id: string;
  senior_id: string;
  senior_first_name?: string | null;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by_name: string | null;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function SeniorDashboard() {
  const { user, profile } = useAuth();
  const { t, lang } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [guardianCount, setGuardianCount] = useState<number>(0);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [lastSos, setLastSos] = useState<SosEvent | null>(null);

  const seenKey = profile ? `kg_alerts_seen_${profile.id}` : "";

  useEffect(() => {
    if (!seenKey) return;
    const v = Number(localStorage.getItem(seenKey) || 0);
    setLastSeen(v);
  }, [seenKey]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("scam_alerts")
        .select("id,channel,scam_type,scam_score,content_preview,status,created_at,senior_id")
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
          const verdict = a.scam_score >= 71 ? t("🚨 Likely scam") : a.scam_score <= 40 ? t("✅ Looks safe") : t("⚠️ Use caution");
          if (a.channel === "email_forward" || a.channel === "ssn_request") {
            toast(`📧 ${t("KinGuard analyzed your forwarded email")} — ${verdict} (${a.scam_score}/100)`, { duration: 8000 });
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, t]);

  // Latest SOS + live "guardian saw your alert" updates
  useEffect(() => {
    if (!profile) return;
    supabase.from("sos_events").select("id,created_at,acknowledged_at,acknowledged_by_name")
      .eq("senior_id", profile.id).order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => {
        const s = data?.[0] as any;
        if (s && Date.now() - new Date(s.created_at).getTime() < 24 * 3600 * 1000) setLastSos(s);
      });
    const ch = supabase.channel(`sos_senior_${profile.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sos_events", filter: `senior_id=eq.${profile.id}` },
        (payload) => {
          const s = payload.new as any;
          if (!s.acknowledged_at) return;
          setLastSos((prev) => (prev && prev.id !== s.id ? prev : s));
          toast(lang === "es"
            ? `${s.acknowledged_by_name || "Su guardián"} vio su alerta a las ${fmtTime(s.acknowledged_at)}.`
            : `${s.acknowledged_by_name || "Your guardian"} saw your alert at ${fmtTime(s.acknowledged_at)}.`, { duration: 10000 });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile, lang]);

  if (!profile) return null;

  const unreadAlerts = alerts.filter((a) => new Date(a.created_at).getTime() > lastSeen);
  const unreadCount = unreadAlerts.length;

  const markAllSeenAndOpen = () => {
    const now = Date.now();
    localStorage.setItem(seenKey, String(now));
    setLastSeen(now);
    setInboxOpen(true);
  };

  const statusText = unreadCount > 0 ? t("Action needed: review your new scam alert") : t("All clear");
  const statusColor = unreadCount > 0 ? "var(--color-danger)" : "var(--color-safe)";

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
        <h1>Hello, {profile.full_name.split(" ")[0]} 👋</h1>
      </header>
      <GuardianRequests onChange={() => supabase.rpc("get_my_guardians").then(({ data }) => setGuardianCount((data ?? []).length))} />
      <SeniorGuardianNotice />
      <section className="px-5 mb-3"><NeverNotice /></section>

      {unreadCount > 0 && (
        <section className="px-5 mb-3">
          <button
            onClick={markAllSeenAndOpen}
            className="w-full card-soft flex items-center gap-3 text-left animate-pulse"
            style={{ background: "var(--color-danger)", color: "#fff", border: "3px solid #fff", boxShadow: "0 4px 14px rgba(231,76,60,0.35)" }}
          >
            <div style={{ fontSize: 32 }}>🔔</div>
            <div className="flex-1">
              <p className="font-extrabold" style={{ fontSize: 20 }}>
                {unreadCount} {unreadCount === 1 ? t("new scam alert") : t("new scam alerts")}
              </p>
              <p style={{ fontSize: 15, opacity: 0.95 }}>{t("Tap to review your results")}</p>
            </div>
            <div className="font-extrabold" style={{ fontSize: 22 }}>›</div>
          </button>
        </section>
      )}

      <section className="px-5">
        <button
          type="button"
          onClick={unreadCount > 0 ? markAllSeenAndOpen : undefined}
          className="card-soft text-center w-full"
          style={{ background: "#fff", cursor: unreadCount > 0 ? "pointer" : "default" }}
        >
          <img src={logo} alt="KinGuard" style={{ width: 120, height: "auto" }} className="mx-auto" />
          <p className="font-extrabold mt-3" style={{ fontSize: 22, color: statusColor }}>{statusText}</p>
        </button>
      </section>

      <section className="px-5 mt-4">
        <div className="card-soft text-center" style={{ background: "var(--color-cream)" }}>
          {streak > 0
            ? <p className="font-bold" style={{ fontSize: 18 }}>🔥 {streak}{lang === "es" ? "-semanas de racha! ¡Sigue así!" : "-week streak! Keep it up!"}</p>
            : <p className="font-bold" style={{ fontSize: 18 }}>{t("Start a new streak this week! You've got this 💪")}</p>}
        </div>
      </section>

      <section className="px-5 mt-4 grid grid-cols-3 gap-2">
        <Stat icon="🚨" label={t("Alerts")} value={totalAlerts} />
        <Stat icon="📧" label={t("Checked")} value={checked} />
        <Link to="/learn" className="card-soft text-center block" style={{ padding: 12, textDecoration: "none", color: "inherit" }}>
          <div style={{ height: 60 }}>
            <LearningTree stats={stats} size={60} />
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>{t("Knowledge Tree")}</div>
        </Link>
      </section>

      <section className="px-5 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2>📬 {t("Scam Alerts Inbox")}</h2>
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
              <AlertCard key={a.id} a={a} unread={new Date(a.created_at).getTime() > lastSeen} />
            ))}
          </ul>
        )}
      </section>

      <section className="px-5 mt-5 space-y-3">
        <Link to="/check" className="btn-base btn-primary w-full">🔍 {t("Check a Suspicious Message")}</Link>
        <Link to="/ssn" className="btn-base btn-primary w-full">🛡️ {t("Protect My SSN")}</Link>
        <button className="btn-base btn-danger w-full" onClick={async () => {
          if (guardianCount === 0) {
            toast(t("Please add a guardian before using SOS Alert."));
            return;
          }
          const { data, error } = await supabase.from("sos_events").insert({ senior_id: user!.id }).select("id,created_at,acknowledged_at,acknowledged_by_name").single();
          if (error) { toast.error(error.message); return; }
          track("help_requested");
          setLastSos(data as any);
          toast(lang === "es" ? "Su alerta fue enviada. Sus guardianes la verán en KinGuard." : "Your alert was sent. Your guardians will see it in KinGuard.", { duration: 8000 });
        }}>
          🆘 {t("I Need Help")}
        </button>
        <p className="text-center" style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
          {t("In an emergency, call 911. KinGuard alerts your family. It is not an emergency service.")}
        </p>
        {lastSos && (
          <p className="text-center font-bold" role="status" style={{ fontSize: 17 }}>
            {lastSos.acknowledged_at
              ? (lang === "es"
                  ? `${lastSos.acknowledged_by_name || "Su guardián"} vio su alerta a las ${fmtTime(lastSos.acknowledged_at)}.`
                  : `${lastSos.acknowledged_by_name || "Your guardian"} saw your alert at ${fmtTime(lastSos.acknowledged_at)}.`)
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
      .select("id,senior_id,senior_first_name,created_at,acknowledged_at,acknowledged_by_name")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setSosEvents((data as SosEvent[]) ?? []));
    load();
    const ch = supabase.channel(`sos_guardian_${profile.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sos_events" }, (p) => {
        const e = p.new as SosEvent;
        setSosEvents((prev) => [e, ...prev.filter((x) => x.id !== e.id)].slice(0, 10));
        notifyGuardianSOS(e.senior_first_name || (lang === "es" ? "Su ser querido" : "Your loved one"), lang);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sos_events" }, (p) => {
        const e = p.new as SosEvent;
        setSosEvents((prev) => prev.map((x) => x.id === e.id ? { ...x, ...e } : x));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile]);
  const [reload, setReload] = useState(0);
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeMsg, setRemoveMsg] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    if (!profile) return;
    supabase.from("guardian_relationships").select("id", { count: "exact", head: true })
      .eq("guardian_id", profile.id).eq("status", "pending")
      .then(({ count }) => setPendingCount(count ?? 0));
  }, [profile, reload]);

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
        .select("id,channel,scam_type,scam_score,content_preview,status,created_at,senior_id")
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

      // Log alert_view for the most recent visible alert per senior (counts as "reviewed")
      const seenSeniors = new Set<string>();
      const viewRows: { guardian_id: string; senior_id: string; alert_id: string; action_type: "alert_view" }[] = [];
      for (const a of allAlerts) {
        if (seenSeniors.has(a.senior_id)) continue;
        seenSeniors.add(a.senior_id);
        viewRows.push({
          guardian_id: profile.id,
          senior_id: a.senior_id,
          alert_id: a.id,
          action_type: "alert_view",
        });
      }
      if (viewRows.length) await supabase.from("guardian_activity").insert(viewRows);

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

  const checkIn = async (id: string) => {
    const { error } = await supabase.rpc("acknowledge_sos", { _id: id });
    if (error) { toast.error(error.message); return; }
    const now = new Date().toISOString();
    const me = profile.full_name.split(" ")[0];
    setSosEvents((prev) => prev.map((e) => e.id === id && !e.acknowledged_at ? { ...e, acknowledged_at: now, acknowledged_by_name: me } : e));
  };

  return (
    <ScreenShell withPhotoPanel>
      <header className="px-5 pt-6 pb-4">
        <h1>Hello, {profile.full_name.split(" ")[0]} 💙</h1>
        <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          You're protecting {seniors.length} {seniors.length === 1 ? "loved one" : "loved ones"}.
        </p>
        {pendingCount > 0 && (
          <p className="mt-1 font-bold" style={{ color: "var(--color-rose)" }}>
            {es
              ? `⏳ Esperando aprobación: ${pendingCount}. Su ser querido debe aprobarle en KinGuard.`
              : `⏳ Waiting for approval: ${pendingCount}. Your loved one must approve you in KinGuard.`}
          </p>
        )}
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
            disabled={seniors.length + pendingCount >= 3}
            aria-disabled={seniors.length + pendingCount >= 3}
            style={seniors.length + pendingCount >= 3 ? { opacity: 0.5, cursor: "not-allowed", filter: "grayscale(1)" } : undefined}
            onClick={() => { setShowAdd((v) => !v); setLinkMsg(null); }}
          >
            ➕ {es ? "Proteger a un nuevo adulto mayor" : "Protect a new senior"} ({seniors.length + pendingCount} {es ? "de" : "of"} 3)
          </button>
          {seniors.length + pendingCount >= 3 && (
            <p className="text-sm mt-2 text-center font-bold" style={{ color: "var(--color-muted-foreground)" }}>
              You are protecting the maximum of 3 seniors.
            </p>
          )}
          {showAdd && seniors.length + pendingCount < 3 && (
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
              return (
                <li key={e.id} className="card-soft" style={{ background: open ? "#E74C3C" : "#FDECEA", color: open ? "#fff" : "#7B1D14", border: "2px solid #C0392B" }}>
                  <p className="font-extrabold" style={{ fontSize: 18 }}>
                    {es
                      ? `🚨 ${name} presionó el botón de alerta — por favor comuníquese con esta persona ahora.`
                      : `🚨 ${name} pressed the alert button — please contact them now.`}
                  </p>
                  <p className="text-sm mt-1">{es ? "Enviada a las" : "Sent at"} {fmtTime(e.created_at)} · {timeAgo(e.created_at)}</p>
                  {open ? (
                    <button type="button" className="btn-base w-full mt-3" style={{ background: "#fff", color: "#C0392B" }} onClick={() => checkIn(e.id)}>
                      ✅ {es ? "Ya me comuniqué" : "I've checked in"}
                    </button>
                  ) : (
                    <p className="text-sm mt-2 font-bold">
                      ✅ {es ? `${e.acknowledged_by_name || "Un guardián"} se comunicó a las` : `${e.acknowledged_by_name || "A guardian"} checked in at`} {fmtTime(e.acknowledged_at!)}
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
              <li key={a.id} className="card-soft flex items-start gap-3">
                <div style={{ fontSize: 28 }}>{channelIcon(a.channel)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{seniorMap[a.senior_id] || "Senior"}</span>
                    <ScoreBadge score={a.scam_score} />
                  </div>
                  <p className="text-sm truncate" style={{ color: "var(--color-muted-foreground)" }}>
                    {a.scam_type || "Suspicious message"} — {(a.content_preview ?? "").slice(0, 100)}{(a.content_preview ?? "").length > 100 ? "…" : ""}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>{timeAgo(a.created_at)}</p>
                </div>
              </li>
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
  return channel === "ssn_request" ? "🛡️" : (channel === "email" || channel === "email_forward") ? "📧" : channel === "sms" ? "📱" : channel === "call" ? "📞" : "🔍";
}

function Stat({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="card-soft text-center" style={{ padding: 12 }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div className="font-extrabold" style={{ fontSize: 22 }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{label}</div>
    </div>
  );
}

function AlertCard({ a, unread }: { a: Alert; unread?: boolean }) {
  return (
    <li
      className="card-soft flex items-start gap-3"
      style={unread ? { border: "3px solid var(--color-danger)", background: "#FFF5F3" } : undefined}
    >
      <div style={{ fontSize: 28 }}>{channelIcon(a.channel)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {unread && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-extrabold"
              style={{ background: "var(--color-danger)", color: "#fff" }}
            >
              NEW
            </span>
          )}
          <span className="font-bold truncate">{a.scam_type || "Suspicious message"}</span>
          <ScoreBadge score={a.scam_score} />
        </div>
        <p className="text-sm truncate" style={{ color: "var(--color-muted-foreground)" }}>
          {a.content_preview}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>{timeAgo(a.created_at)}</p>
      </div>
    </li>
  );
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}
