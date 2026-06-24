import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { ScreenShell } from "@/components/ScreenShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScoreCard } from "@/components/ScoreCard";
import { BadgeGrid } from "@/components/BadgeGrid";
import { normalizeStats } from "@/lib/badges";
import { LearningTree, LearningTreeWithTooltip } from "@/components/LearningTree";
import { useI18n, LanguageToggle } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { generatePassphrase } from "@/lib/passphrase";
import {
  setFamilyCodeWord,
  revealFamilyCodeWord,
  clearFamilyCodeWord,
} from "@/lib/familyCode.functions";

export const Route = createFileRoute("/profile")({
  component: ProfileScreen,
});

type GuardianRow = {
  link_id: string;
  guardian_id: string;
  full_name: string;
  relationship_label: string | null;
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

function actionLabel(a: ActivityRow, t: (s: string) => string): string {
  const who = a.guardian_first_name;
  const alertWord = a.alert_scam_type || t("alert");
  switch (a.action_type) {
    case "app_open": return `${who} ${t("opened the app")}`;
    case "alert_view": return `${who} ${t("viewed your")} ${alertWord}`;
    case "acknowledged": return `${who} ${t("acknowledged your")} ${alertWord}`;
    case "called_senior": return `${who} ${t("called you about your")} ${alertWord}`;
    case "blocked_sender": return `${who} ${t("blocked the sender of your")} ${alertWord}`;
  }
}

function ProfileScreen() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [guardians, setGuardians] = useState<GuardianRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
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
          track("badge_earned", { badge_id: "team_player", badge_name: "Team Player" });
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
    if (error) { toast(t("Could not remove. Try again.")); return; }
    setGuardians((g) => g.filter((r) => r.link_id !== linkId));
    toast(t("✅ Guardian removed"));
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast(t("Your account has been deleted."));
      navigate({ to: "/" });
    } catch (e: any) {
      toast(e?.message || t("Could not delete account. Try again."));
    } finally {
      setDeleting(false);
    }
  };

  const isSenior = profile.role === "senior";

  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <h1>👤 {t("Profile")}</h1>
        <LanguageToggle />
      </header>
      <section className="px-5 space-y-4">
        <div className="card-soft">
          <p><span className="font-bold">{t("Name:")}</span> {profile.full_name}</p>
          <p className="mt-1"><span className="font-bold">{t("Role:")}</span> {isSenior ? t("Protected Senior") : t("Guardian")}</p>
          {isSenior && profile.invite_code && (
            <div className="mt-3">
              <p className="font-bold mb-1">{t("Your invite code:")}</p>
              <div className="invite-code text-3xl font-extrabold tracking-widest text-center py-3 rounded-xl"
                style={{ background: "var(--color-sky)" }}>{profile.invite_code}</div>
              <p className="text-sm mt-2" style={{ color: "var(--color-muted-foreground)" }}>
                {t("Share this with up to 5 family members. Each can link to you with this same code.")}
              </p>
            </div>
          )}
        </div>

        {isSenior && (
          <>
            <div>
              <h2 className="mb-2">{t("Knowledge Tree 🌳")}</h2>
              <ScoreCard
                stats={profile.challenge_stats}
                tree={
                  <LearningTree
                    stats={normalizeStats(profile.challenge_stats)}
                    size={48}
                  />
                }
              />
            </div>

            <div>
              <h2 className="mb-2">{t("My Badges 🏅")}</h2>
              <BadgeGrid stats={profile.challenge_stats} />
            </div>

            <div className="card-soft">
              <h2 className="mb-2">
                {t("My Guardians:")} {guardians.length}/5
                {guardians.length < 5 && (
                  <span className="text-sm font-normal" style={{ color: "var(--color-muted-foreground)" }}>
                    {" "}— {5 - guardians.length} {5 - guardians.length === 1 ? t("slot available") : t("slots available")}
                  </span>
                )}
              </h2>
              {guardians.length === 0 ? (
                <p style={{ color: "var(--color-muted-foreground)" }}>
                  {t("No one is linked yet. Share your invite code above.")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {guardians.map((g) => {
                    const active = lastActiveLabel(g.last_alert_view_at);
                    const dot = active.status === "active" ? "🟢" : active.status === "inactive" ? "🟡" : "🔴";
                    const dotLabel = active.status === "active" ? t("Active") : active.status === "inactive" ? t("Inactive") : t("Never checked");
                    return (
                      <li key={g.link_id} className="rounded-xl p-3 border-2" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-extrabold" style={{ fontSize: 18 }}>{g.full_name}</p>
                            <p className="text-sm font-bold mt-0.5" style={{ color: "var(--color-rose)" }}>
                              {g.relationship_label || t("Family")}
                            </p>
                            <p className="text-sm mt-2" style={{ color: "var(--color-muted-foreground)" }}>
                              {t("Linked:")} {formatDate(g.linked_at)}
                            </p>
                            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                              {active.text}
                            </p>
                            <p className="text-sm mt-1">
                              <span className="font-bold">{t("Last viewed your alerts:")}</span> {timeframe(g.last_alert_view_at)}
                            </p>
                            <p className="text-sm">
                              <span className="font-bold">{t("Total alerts reviewed:")}</span> {g.total_alerts_reviewed ?? 0}
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
                          {t("🗑️ Remove Guardian")}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {guardians.length >= 5 && (
                <p className="text-sm mt-3 font-bold" style={{ color: "var(--color-warn)" }}>
                  {t("You've reached the maximum of 5 guardians. Remove one before adding another.")}
                </p>
              )}
            </div>

            {(() => {
              const slotsAvail = 5 - guardians.length;
              const neglected = guardians.filter((g) => {
                if (g.last_alert_view_at) return false;
                const days = Math.floor((Date.now() - new Date(g.linked_at).getTime()) / 86400000);
                return days > 30;
              });
              if (neglected.length === 0) return null;
              return (
                <div className="card-soft" style={{ background: "var(--color-cream)", border: "2px solid var(--color-warn)" }}>
                  {neglected.map((g) => (
                    <p key={g.link_id} className="mb-2 last:mb-0">
                      👋 <span className="font-bold">{g.full_name}</span> hasn't checked your alerts yet. You may want to remind them or add a more active guardian. You have {slotsAvail} guardian slot{slotsAvail === 1 ? "" : "s"} available.
                    </p>
                  ))}
                </div>
              );
            })()}

            <div className="card-soft">
              <h2 className="mb-2">{t("Guardian Activity")}</h2>
              {activity.length === 0 && guardians.every((g) => g.last_alert_view_at) ? (
                <p style={{ color: "var(--color-muted-foreground)" }}>
                  {t("No guardian activity yet. When your guardians open the app or view your alerts, you'll see it here.")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {activity.map((a) => (
                    <li key={a.id} className="text-sm flex items-start gap-2">
                      <span style={{ color: "var(--color-muted-foreground)" }}>•</span>
                      <span className="flex-1">
                        {actionLabel(a, t)} — <span style={{ color: "var(--color-muted-foreground)" }}>{timeframe(a.created_at)}</span>
                      </span>
                    </li>
                  ))}
                  {guardians.filter((g) => !g.last_alert_view_at).map((g) => (
                    <li key={g.link_id} className="text-sm flex items-start gap-2">
                      <span>🔴</span>
                      <span className="flex-1">{g.full_name} {t("has never viewed your alerts")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card-soft">
              <p className="font-bold mb-2">{t("Text size")}</p>
              <div className="flex gap-2">
                <button className={`btn-base flex-1 ${profile.font_size==="large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("large")}>{t("Large")}</button>
                <button className={`btn-base flex-1 ${profile.font_size==="extra_large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("extra_large")}>{t("Extra Large")}</button>
              </div>
            </div>
          </>
        )}

        <Link to="/privacy" className="btn-base btn-outline w-full">{t("🔒 Privacy & Safety")}</Link>

        <button className="btn-base btn-outline w-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          {t("Sign Out")}
        </button>

        <div className="card-soft" style={{ border: "3px solid #E74C3C", background: "color-mix(in oklab, #E74C3C 6%, #fff)" }}>
          <p className="font-extrabold uppercase tracking-wider mb-2" style={{ color: "#a02c20", fontSize: 14 }}>
            ⚠️ {t("Danger Zone")}
          </p>
          <p className="text-sm mb-3" style={{ color: "var(--color-muted-foreground)" }}>
            {t("Permanently delete your account and all your data. This cannot be undone.")}
          </p>
          <button
            className="btn-base w-full"
            style={{ background: "#E74C3C", color: "#fff" }}
            onClick={() => { setConfirmDelete(true); setDeleteText(""); }}
          >
            {t("🗑️ Delete My Account")}
          </button>
        </div>

        {confirmDelete && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <div
              className="card-soft w-full max-w-md"
              style={{ border: "3px solid #E74C3C" }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-extrabold" style={{ fontSize: 20, color: "#E74C3C" }}>
                {t("Are you absolutely sure?")}
              </p>
              <p className="mt-2">
                {t("This will permanently delete your account and all your data. This cannot be undone.")}
              </p>
              <p className="mt-4 font-bold">
                {t("To confirm, type")} <span style={{ fontFamily: "monospace", fontSize: 20 }}>DELETE</span> {t("below:")}
              </p>
              <input
                className="input-large mt-2 text-center"
                style={{ fontSize: 24, letterSpacing: "0.15em", fontWeight: 800 }}
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                autoFocus
              />
              <div className="grid grid-cols-1 gap-2 mt-4">
                <button
                  className="btn-base w-full"
                  style={{ background: "#E74C3C", color: "#fff", opacity: deleteText === "DELETE" ? 1 : 0.5 }}
                  disabled={deleting || deleteText !== "DELETE"}
                  onClick={deleteAccount}
                >
                  {deleting ? t("Deleting…") : t("Yes, Delete My Account")}
                </button>
                <button
                  className="btn-base w-full"
                  style={{ background: "#9b9b9b", color: "#fff" }}
                  disabled={deleting}
                  onClick={() => { setConfirmDelete(false); setDeleteText(""); }}
                >
                  {t("Cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </ScreenShell>
  );
}
