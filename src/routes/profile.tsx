import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ScreenShell } from "@/components/ScreenShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScoreCard } from "@/components/ScoreCard";
import { BadgeGrid } from "@/components/BadgeGrid";
import { normalizeStats } from "@/lib/badges";
import { LearningTreeWithTooltip } from "@/components/LearningTree";

export const Route = createFileRoute("/profile")({
  component: ProfileScreen,
});

type GuardianRow = {
  link_id: string;
  guardian_id: string;
  full_name: string;
  relationship_label: string | null;
  phone_last4: string | null;
  linked_at: string;
  last_alert_view_at: string | null;
  total_alerts_reviewed: number;
};

type ActivityRow = {
  id: string;
  guardian_id: string;
  guardian_first_name: string;
  alert_id: string | null;
  alert_scam_type: string | null;
  action_type: "app_open" | "alert_view" | "acknowledged" | "called_senior" | "blocked_sender";
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function timeframe(iso: string | null): string {
  if (!iso) return "Never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) {
    const d = new Date(iso);
    return `Today ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase()}`;
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) { const w = Math.floor(days / 7); return `${w} week${w === 1 ? "" : "s"} ago`; }
  if (days < 365) { const m = Math.floor(days / 30); return `${m} month${m === 1 ? "" : "s"} ago`; }
  const y = Math.floor(days / 365); return `${y} year${y === 1 ? "" : "s"} ago`;
}

function lastActiveLabel(iso: string | null): { text: string; status: "active" | "inactive" | "never" } {
  if (!iso) return { text: "Never checked alerts", status: "never" };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const status: "active" | "inactive" = days <= 7 ? "active" : "inactive";
  return { text: `Last active: ${timeframe(iso)}`, status };
}

function actionLabel(a: ActivityRow): string {
  const who = a.guardian_first_name;
  switch (a.action_type) {
    case "app_open": return `${who} opened the app`;
    case "alert_view": return `${who} viewed your ${a.alert_scam_type || "alert"}`;
    case "acknowledged": return `${who} acknowledged your ${a.alert_scam_type || "alert"}`;
    case "called_senior": return `${who} called you about your ${a.alert_scam_type || "alert"}`;
    case "blocked_sender": return `${who} blocked the sender of your ${a.alert_scam_type || "alert"}`;
  }
}

function ProfileScreen() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [guardians, setGuardians] = useState<GuardianRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile || profile.role !== "senior") return;
    (async () => {
      const [{ data: gData }, { data: aData }] = await Promise.all([
        supabase.rpc("get_my_guardians"),
        supabase.rpc("get_guardian_activity_feed"),
      ]);
      const rows = (gData ?? []) as GuardianRow[];
      setGuardians(rows);
      setActivity((aData ?? []) as ActivityRow[]);

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

  const removeGuardian = async (linkId: string) => {
    const { error } = await supabase.from("guardian_relationships").delete().eq("id", linkId);
    if (error) { toast("Could not remove. Try again."); return; }
    setGuardians((g) => g.filter((r) => r.link_id !== linkId));
    toast("✅ Guardian removed");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast("Your account has been deleted.");
      navigate({ to: "/" });
    } catch (e: any) {
      toast(e?.message || "Could not delete account. Try again.");
    } finally {
      setDeleting(false);
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
                Share this with up to 5 family members. Each can link to you with this same code.
              </p>
            </div>
          )}
        </div>

        {isSenior && (
          <>
            <div className="card-soft">
              <h2 className="mb-2">My Tree 🌳</h2>
              <div style={{ height: 120 }}>
                <LearningTreeWithTooltip stats={normalizeStats(profile.challenge_stats)} size={120} showLabel />
              </div>
            </div>

            <div>
              <h2 className="mb-2">My Progress 🏅</h2>
              <ScoreCard stats={profile.challenge_stats} />
            </div>

            <div>
              <h2 className="mb-2">My Badges 🏅</h2>
              <BadgeGrid stats={profile.challenge_stats} />
            </div>

            <div className="card-soft">
              <h2 className="mb-2">
                My Guardians: {guardians.length}/5
                {guardians.length < 5 && (
                  <span className="text-sm font-normal" style={{ color: "var(--color-muted-foreground)" }}>
                    {" "}— {5 - guardians.length} slot{5 - guardians.length === 1 ? "" : "s"} available
                  </span>
                )}
              </h2>
              {guardians.length === 0 ? (
                <p style={{ color: "var(--color-muted-foreground)" }}>
                  No one is linked yet. Share your invite code above.
                </p>
              ) : (
                <ul className="space-y-3">
                  {guardians.map((g) => {
                    const active = lastActiveLabel(g.last_alert_view_at);
                    const dot = active.status === "active" ? "🟢" : active.status === "inactive" ? "🟡" : "🔴";
                    const dotLabel = active.status === "active" ? "Active" : active.status === "inactive" ? "Inactive" : "Never checked";
                    const phoneFmt = g.phone_last4 ? `•••-•••-${g.phone_last4}` : "Phone not provided";
                    return (
                      <li key={g.link_id} className="rounded-xl p-3 border-2" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-extrabold" style={{ fontSize: 18 }}>{g.full_name}</p>
                            <p className="text-sm font-bold mt-0.5" style={{ color: "var(--color-rose)" }}>
                              {g.relationship_label || "Family"}
                            </p>
                            <p className="text-sm font-mono mt-1">{phoneFmt}</p>
                            <p className="text-sm mt-2" style={{ color: "var(--color-muted-foreground)" }}>
                              Linked: {formatDate(g.linked_at)}
                            </p>
                            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                              {active.text}
                            </p>
                          </div>
                          <span className="text-sm font-bold whitespace-nowrap" title={dotLabel}>
                            {dot} {dotLabel}
                          </span>
                        </div>
                        <button
                          className="btn-base w-full mt-3"
                          style={{ background: "#E74C3C", color: "#fff", minHeight: 44 }}
                          onClick={() => removeGuardian(g.link_id)}
                        >
                          🗑️ Remove Guardian
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {guardians.length >= 5 && (
                <p className="text-sm mt-3 font-bold" style={{ color: "var(--color-warn)" }}>
                  You've reached the maximum of 5 guardians. Remove one before adding another.
                </p>
              )}
            </div>

            <div className="card-soft">
              <p className="font-bold mb-2">Text size</p>
              <div className="flex gap-2">
                <button className={`btn-base flex-1 ${profile.font_size==="large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("large")}>Large</button>
                <button className={`btn-base flex-1 ${profile.font_size==="extra_large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("extra_large")}>Extra Large</button>
              </div>
            </div>
          </>
        )}

        <Link to="/privacy" className="btn-base btn-outline w-full">🔒 Privacy & Safety</Link>

        <button className="btn-base btn-outline w-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          Sign Out
        </button>

        {!confirmDelete ? (
          <button
            className="btn-base w-full"
            style={{ background: "#E74C3C", color: "#fff" }}
            onClick={() => setConfirmDelete(true)}
          >
            🗑️ Delete My Account
          </button>
        ) : (
          <div className="card-soft" style={{ border: "2px solid #E74C3C" }}>
            <p className="font-extrabold" style={{ fontSize: 19, color: "#E74C3C" }}>Are you sure?</p>
            <p className="mt-2">This will permanently delete your account and all your data. This cannot be undone.</p>
            <div className="grid grid-cols-1 gap-2 mt-4">
              <button
                className="btn-base w-full"
                style={{ background: "#E74C3C", color: "#fff" }}
                disabled={deleting}
                onClick={deleteAccount}
              >
                {deleting ? "Deleting…" : "Yes, Delete My Account"}
              </button>
              <button
                className="btn-base w-full"
                style={{ background: "#9b9b9b", color: "#fff" }}
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </ScreenShell>
  );
}
