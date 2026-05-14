import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
            <div>
              <h2 className="mb-2">My Progress 🏅</h2>
              <ScoreCard stats={profile.challenge_stats} />
            </div>

            <div>
              <h2 className="mb-2">My Badges 🏅</h2>
              <BadgeGrid stats={profile.challenge_stats} />
            </div>

            <div className="card-soft">
              <h2 className="mb-2">My Guardians: {guardians.length}/5</h2>
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
