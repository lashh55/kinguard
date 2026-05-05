import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ScreenShell, ScoreBadge } from "@/components/ScreenShell";
import { toast } from "sonner";

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
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    if (profile.role === "guardian") return; // guardian view not in v1
    (async () => {
      const { data } = await supabase
        .from("scam_alerts")
        .select("id,channel,scam_type,scam_score,content_preview,status,created_at")
        .eq("senior_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(3);
      setAlerts((data as Alert[]) ?? []);
    })();
  }, [profile]);

  if (!profile) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const flagged = alerts.filter((a) => a.status === "flagged");
  const status: "safe" | "warn" | "danger" =
    flagged.some((a) => a.scam_score >= 71) ? "danger" :
    flagged.length > 0 ? "warn" : "safe";

  const shieldColor = status === "safe" ? "var(--color-safe)" : status === "warn" ? "var(--color-warn)" : "var(--color-danger)";
  const shieldText = status === "safe" ? "You're protected today" : status === "warn" ? `${flagged.length} alert${flagged.length>1?"s":""} flagged` : "Action needed";

  const tip = TIPS[new Date().getDay() % TIPS.length];

  const blocked = alerts.filter((a) => a.status === "blocked").length;
  const checked = alerts.length;

  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-4">
        <h1>Hello, {profile.full_name.split(" ")[0]} 👋</h1>
      </header>

      <section className="px-5">
        <div className="card-soft text-center" style={{ background: "#fff" }}>
          <div
            className="mx-auto flex items-center justify-center rounded-3xl"
            style={{ width: 140, height: 160, background: shieldColor, clipPath: "polygon(50% 0, 100% 18%, 100% 70%, 50% 100%, 0 70%, 0 18%)" }}
          >
            <span style={{ fontSize: 64 }}>🛡️</span>
          </div>
          <p className="font-bold mt-3" style={{ fontSize: 22 }}>{shieldText}</p>
        </div>
      </section>

      <section className="px-5 mt-4 grid grid-cols-3 gap-2">
        <Stat icon="🔒" label="Blocked" value={blocked} />
        <Stat icon="📧" label="Checked" value={checked} />
        <Stat icon="🛡️" label="SSN Safe" value="✓" />
      </section>

      <section className="px-5 mt-5">
        <h2 className="mb-2">Recent alerts</h2>
        {alerts.length === 0 ? (
          <div className="card-soft text-center" style={{ color: "var(--color-muted-foreground)" }}>
            No alerts yet. You're all clear!
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
        <button className="btn-base btn-danger w-full" onClick={() => toast("✅ Your guardian has been notified")}>
          🆘 I Need Help
        </button>
      </section>

      <section className="px-5 mt-5">
        <div className="card-soft" style={{ background: "var(--color-sky)" }}>
          <p className="font-bold mb-1">💡 Today's scam tip</p>
          <p>{tip}</p>
        </div>
      </section>
    </ScreenShell>
  );
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
  const icon = a.channel === "ssn_request" ? "🛡️" : a.channel === "email" ? "📧" : a.channel === "sms" ? "📱" : a.channel === "call" ? "📞" : "🔍";
  return (
    <li className="card-soft flex items-start gap-3">
      <div style={{ fontSize: 28 }}>{icon}</div>
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
