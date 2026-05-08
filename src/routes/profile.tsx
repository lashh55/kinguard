import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ScreenShell } from "@/components/ScreenShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScoreCard } from "@/components/ScoreCard";
import { BadgeGrid } from "@/components/BadgeGrid";
import { normalizeStats } from "@/lib/badges";

export const Route = createFileRoute("/profile")({
  component: ProfileScreen,
});

type GuardianRow = {
  id: string;
  guardian_id: string;
  relationship_label: string | null;
  guardian_name?: string;
};

function ProfileScreen() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [guardians, setGuardians] = useState<GuardianRow[]>([]);
  const [switching, setSwitching] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile || profile.role !== "senior") return;
    (async () => {
      const { data } = await supabase
        .from("guardian_relationships")
        .select("id,guardian_id,relationship_label")
        .eq("senior_id", profile.id)
        .eq("status", "active");
      const rows = (data ?? []) as GuardianRow[];
      const ids = rows.map((r) => r.guardian_id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
        rows.forEach((r) => { r.guardian_name = map.get(r.guardian_id) || "Guardian"; });
      }
      setGuardians(rows);

      // Team Player bonus badge
      if (rows.length >= 2) {
        const stats = normalizeStats(profile.challenge_stats);
        if (!stats.badges_earned.includes("team_player")) {
          const updated = { ...stats, badges_earned: [...stats.badges_earned, "team_player"] };
          await supabase.from("profiles").update({ challenge_stats: updated as any }).eq("id", profile.id);
          toast("👨‍👩‍👧 You earned the Team Player badge!");
          refreshProfile();
        }
      }
    })();
  }, [profile]);

  if (!profile) return null;

  const setFont = async (size: "large" | "extra_large") => {
    await supabase.from("profiles").update({ font_size: size }).eq("id", profile.id);
    await refreshProfile();
  };

  const removeGuardian = async (id: string) => {
    const { error } = await supabase.from("guardian_relationships").delete().eq("id", id);
    if (error) { toast("Could not remove. Try again."); return; }
    setGuardians((g) => g.filter((r) => r.id !== id));
    toast("✅ Guardian removed");
  };

  const switchRole = async () => {
    if (!profile) return;
    const target: "senior" | "guardian" = profile.role === "senior" ? "guardian" : "senior";
    const confirmMsg = target === "guardian"
      ? "Switch to Guardian mode? You'll be helping protect a loved one."
      : "Switch to Protected Senior mode? You'll get scam protection tools and a personal invite code.";
    if (!confirm(confirmMsg)) return;
    setSwitching(true);
    try {
      await supabase.from("profiles").update({ role: target }).eq("id", profile.id);
      await refreshProfile();
      toast(`✅ Switched to ${target === "senior" ? "Protected Senior" : "Guardian"}`);
      navigate({ to: "/dashboard" });
    } catch {
      toast("Could not switch. Try again.");
    } finally {
      setSwitching(false);
    }
  };

  const isSenior = profile.role === "senior";

  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3"><h1>👤 My Profile</h1></header>
      <section className="px-5 space-y-4">
        <div className="card-soft">
          <p><span className="font-bold">Name:</span> {profile.full_name}</p>
          <p className="mt-1"><span className="font-bold">Role:</span> {isSenior ? "Protected Senior" : "Guardian"}</p>
          {profile.phone_number && <p className="mt-1"><span className="font-bold">Phone:</span> {profile.phone_number}</p>}
          {isSenior && profile.invite_code && (
            <div className="mt-3">
              <p className="font-bold mb-1">Your invite code:</p>
              <div className="text-3xl font-extrabold tracking-widest text-center py-3 rounded-xl"
                style={{ background: "var(--color-sky)" }}>{profile.invite_code}</div>
              <p className="text-sm mt-2" style={{ color: "var(--color-muted-foreground)" }}>
                Share this with as many family members as you want — they can each link to you.
              </p>
            </div>
          )}
        </div>

        {isSenior && (
          <>
            <div>
              <h2 className="mb-2">My Progress 🏅</h2>
              <ScoreCard stats={profile.challenge_stats} />
            </div>

            <div>
              <h2 className="mb-2">My Badges 🏅</h2>
              <BadgeGrid stats={profile.challenge_stats} />
            </div>

            <div className="card-soft">
              <h2 className="mb-2">My Guardians</h2>
              {guardians.length === 0 ? (
                <p style={{ color: "var(--color-muted-foreground)" }}>
                  No one is linked yet. Share your invite code above.
                </p>
              ) : (
                <ul className="space-y-2">
                  {guardians.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 rounded-xl p-3 border-2" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <p className="font-bold">{g.guardian_name}</p>
                        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>{g.relationship_label || "Family"}</p>
                      </div>
                      <button className="btn-base btn-outline" style={{ minHeight: 44, padding: "8px 14px", fontSize: 16 }} onClick={() => removeGuardian(g.id)}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="card-soft">
          <p className="font-bold mb-2">Text size</p>
          <div className="flex gap-2">
            <button className={`btn-base flex-1 ${profile.font_size==="large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("large")}>Large</button>
            <button className={`btn-base flex-1 ${profile.font_size==="extra_large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("extra_large")}>Extra Large</button>
          </div>
        </div>

        <div className="card-soft">
          <p className="font-bold mb-1">Switch role</p>
          <p className="text-sm mb-3" style={{ color: "var(--color-muted-foreground)" }}>
            You're currently a <span className="font-bold">{isSenior ? "Protected Senior" : "Guardian"}</span>.
            {isSenior ? " Switch to Guardian to help protect someone else." : " Switch to Protected Senior to use the full ScamShield tools."}
          </p>
          <button className="btn-base btn-sky w-full" disabled={switching} onClick={switchRole}>
            {switching ? "Switching…" : isSenior ? "🔄 Switch to Guardian" : "🔄 Switch to Protected Senior"}
          </button>
        </div>

        <button className="btn-base btn-outline w-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          Sign Out
        </button>
      </section>
    </ScreenShell>
  );
}
