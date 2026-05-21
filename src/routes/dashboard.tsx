import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ScreenShell, ScoreBadge } from "@/components/ScreenShell";
import { notifyGuardianSOS } from "@/lib/guardianAlerts";
import { normalizeStats } from "@/lib/badges";
import logo from "@/assets/kinguard-logo.png";
import { LearningTree } from "@/components/LearningTree";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard")({
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

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  if (!profile) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return profile.role === "guardian" ? <GuardianDashboard /> : <SeniorDashboard />;
}

function SeniorDashboard() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("scam_alerts")
        .select("id,channel,scam_type,scam_score,content_preview,status,created_at,senior_id")
        .eq("senior_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(3);
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
  }, [profile]);

  if (!profile) return null;

  const flagged = alerts.filter((a) => a.status === "flagged");
  const status: "safe" | "warn" | "danger" =
    flagged.some((a) => a.scam_score >= 71) ? "danger" :
    flagged.length > 0 ? "warn" : "safe";

  const statusText = status === "safe" ? t("You're protected today") : status === "warn" ? `${flagged.length} alert${flagged.length>1?"s":""} flagged` : "Action needed";
  const statusColor = status === "safe" ? "var(--color-safe)" : status === "warn" ? "var(--color-warn)" : "var(--color-danger)";

  const tip = TIPS[new Date().getDay() % TIPS.length];
  const blocked = alerts.filter((a) => a.status === "blocked").length;
  const checked = alerts.length;

  const stats = normalizeStats(profile.challenge_stats);
  const streak = stats.current_streak_weeks;

  const choose = async (letter: "a"|"b"|"c"|"d") => {
    if (!question || picked) return;
    setPicked(letter);
    await supabase.from("quiz_attempts").insert({
      user_id: profile.id,
      question_id: question.id,
      was_correct: letter === question.correct_answer,
    });
  };

  return (
    <ScreenShell withPhotoPanel>
      <header className="px-5 pt-6 pb-4">
        <h1>Hello, {profile.full_name.split(" ")[0]} 👋</h1>
      </header>

      <section className="px-5">
        <div className="card-soft text-center" style={{ background: "#fff" }}>
          <img src={logo} alt="KinGuard" style={{ width: 120, height: "auto" }} className="mx-auto" />
          <p className="font-extrabold mt-3" style={{ fontSize: 22, color: statusColor }}>{statusText}</p>
        </div>
      </section>

      <section className="px-5 mt-4">
        <div className="card-soft text-center" style={{ background: "var(--color-cream)" }}>
          {streak > 0
            ? <p className="font-bold" style={{ fontSize: 18 }}>🔥 {streak}-week streak! Keep it up!</p>
            : <p className="font-bold" style={{ fontSize: 18 }}>Start a new streak this week! You've got this 💪</p>}
        </div>
      </section>

      <section className="px-5 mt-4 grid grid-cols-3 gap-2">
        <Stat icon="🔒" label="Blocked" value={blocked} />
        <Stat icon="📧" label="Checked" value={checked} />
        <Link to="/learn" className="card-soft text-center block" style={{ padding: 12, textDecoration: "none", color: "inherit" }}>
          <div style={{ height: 60 }}>
            <LearningTree stats={stats} size={60} />
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>Knowledge Tree</div>
        </Link>
      </section>

      <section className="px-5 mt-5">
        <h2 className="mb-2">Recent alerts</h2>
        {alerts.length === 0 ? (
          <div className="card-soft text-center font-bold" style={{ color: "#2ECC71" }}>
            ✅ No alerts yet. You're all clear!
          </div>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => <AlertCard key={a.id} a={a} />)}
          </ul>
        )}
      </section>

      <section className="px-5 mt-5 space-y-3">
        <Link to="/check" className="btn-base btn-primary w-full">🔍 Check a Suspicious Message</Link>
        <Link to="/ssn" className="btn-base btn-primary w-full">🛡️ Protect My SSN</Link>
        <button className="btn-base btn-danger w-full" onClick={() => notifyGuardianSOS(profile.full_name)}>
          🆘 I Need Help
        </button>
      </section>

      {question && (
        <section className="px-5 mt-5">
          <div className="card-soft" style={{ background: "var(--color-cream)" }}>
            <p className="font-bold mb-1">🧠 This Week's Question</p>
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
                {picked === question.correct_answer ? "✅ Correct! " : "❌ Not quite. "}
                {question.explanation}
              </p>
            )}
            <Link to="/learn" className="btn-base btn-outline w-full mt-3">See All Questions</Link>
          </div>
        </section>
      )}

      <section className="px-5 mt-5">
        <div className="card-soft" style={{ background: "var(--color-sky)" }}>
          <p className="font-bold mb-1">💡 Today's scam tip</p>
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
  const [seniors, setSeniors] = useState<LinkedSenior[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [seniorMap, setSeniorMap] = useState<Record<string, string>>({});

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
  }, [profile]);

  if (!profile) return null;

  return (
    <ScreenShell withPhotoPanel>
      <header className="px-5 pt-6 pb-4">
        <h1>Hello, {profile.full_name.split(" ")[0]} 💙</h1>
        <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          You're protecting {seniors.length} {seniors.length === 1 ? "loved one" : "loved ones"}.
        </p>
      </header>

      <section className="px-5">
        <h2 className="mb-2">You are protecting</h2>
        {seniors.length === 0 ? (
          <div className="card-soft text-center">
            <p className="font-bold mb-2">No one linked yet</p>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              Ask your loved one for their 6-letter invite code, then sign in again to link.
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
                  </div>
                  {s.alertCount > 0 ? (
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
      </section>

      <section className="px-5 mt-6">
        <h2 className="mb-2">Recent alerts</h2>
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
  return channel === "ssn_request" ? "🛡️" : channel === "email" ? "📧" : channel === "sms" ? "📱" : channel === "call" ? "📞" : "🔍";
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

function AlertCard({ a }: { a: Alert }) {
  return (
    <li className="card-soft flex items-start gap-3">
      <div style={{ fontSize: 28 }}>{channelIcon(a.channel)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
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
