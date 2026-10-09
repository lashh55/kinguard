import { pageHead } from "@/lib/pageHead";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { ScreenShell } from "@/components/ScreenShell";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSignOutConfirm } from "@/components/SignOutConfirm";
import { normalizeStats } from "@/lib/badges";
import { useI18n, LanguageToggle } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { generatePassphrase } from "@/lib/passphrase";
import { NameFields, formatName, isValidName } from "@/components/NameFields";
import {
  setFamilyCodeWord,
  revealFamilyCodeWord,
  clearFamilyCodeWord,
} from "@/lib/familyCode.functions";

export const Route = createFileRoute("/profile")({
  head: () => pageHead("Your profile", "Manage your KinGuard profile, guardian connections, and safety preferences."),
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
  const { t, lang } = useI18n();
  const { ask: askSignOut, dialog: signOutDialog } = useSignOutConfirm();
  const navigate = useNavigate();
  const [guardians, setGuardians] = useState<GuardianRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmNewCode, setConfirmNewCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editFirst, setEditFirst] = useState("");
  const [editInitial, setEditInitial] = useState("");
  const [savingName, setSavingName] = useState(false);
  const startEditName = () => {
    const parts = (profile?.full_name || "").trim().split(/\s+/);
    const last = parts.length > 1 ? parts[parts.length - 1] : "";
    setEditFirst(parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "");
    setEditInitial((last.match(/\p{L}/u)?.[0] || "").toUpperCase());
    setEditingName(true);
  };
  const saveName = async () => {
    if (!profile || !isValidName(editFirst, editInitial)) {
      toast.error(t("Please enter your first name and the first letter of your last name."));
      return;
    }
    setSavingName(true);
    const full = formatName(editFirst, editInitial);
    const { error } = await supabase.from("profiles").update({ full_name: full }).eq("id", profile.id);
    if (!error) await supabase.auth.updateUser({ data: { full_name: full } });
    setSavingName(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    setEditingName(false);
    toast.success(t("Name updated."));
  };
  const [confirmRemoveGuardian, setConfirmRemoveGuardian] = useState<GuardianRow | null>(null);
  const [removingGuardian, setRemovingGuardian] = useState(false);

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

  const removeGuardian = async () => {
    if (!confirmRemoveGuardian) return;
    setRemovingGuardian(true);
    const { error } = await supabase.from("guardian_relationships").delete().eq("id", confirmRemoveGuardian.link_id);
    setRemovingGuardian(false);
    if (error) { toast(t("Could not remove. Try again.")); return; }
    setGuardians((g) => g.filter((r) => r.link_id !== confirmRemoveGuardian.link_id));
    setConfirmRemoveGuardian(null);
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

  const regenerateInviteCode = async () => {
    setRegenerating(true);
    try {
      const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      const bytes = new Uint32Array(6);
      crypto.getRandomValues(bytes);
      const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
      const { error } = await supabase
        .from("profiles")
        .update({ invite_code: code })
        .eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      setConfirmNewCode(false);
      toast(t("Your new invite code is ready. Share it with your guardians."));
    } catch (e: any) {
      toast(e?.message || t("Could not generate a new code. Try again."));
    } finally {
      setRegenerating(false);
    }
  };

  const copyInviteCode = async () => {
    const code = profile.invite_code;
    if (!code) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedCode(true);
      toast(t("Code copied!"));
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      toast(t("Could not copy. Please read the code aloud instead."));
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
          {editingName ? (
            <div className="space-y-3 mb-3">
              <NameFields first={editFirst} initial={editInitial} onFirst={setEditFirst} onInitial={setEditInitial} />
              <div className="flex gap-2">
                <button type="button" className="btn-base btn-primary flex-1" disabled={savingName} onClick={saveName}>{t("Save")}</button>
                <button type="button" className="btn-base btn-outline flex-1" onClick={() => setEditingName(false)}>{t("Cancel")}</button>
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-3 flex-wrap">
              <span><span className="font-bold">{t("Name:")}</span> {profile.full_name}</span>
              <button type="button" className="text-sm underline font-bold" onClick={startEditName}>{t("Edit name")}</button>
            </p>
          )}
          <p className="mt-1"><span className="font-bold">{t("Role:")}</span> {isSenior ? t("Protected Senior") : t("Guardian")}</p>
          {isSenior && profile.invite_code && (
            <div className="mt-3">
              <p className="font-bold mb-1">{t("Your invite code:")}</p>
              <p className="text-sm mb-2" style={{ color: "var(--color-muted-foreground)" }}>{t("This code expires 24 hours after it is created. Tap \"Generate new code\" for a fresh one.")}</p>
              <div className="flex items-stretch gap-2">
                <div className="invite-code text-3xl font-extrabold tracking-widest text-center py-3 rounded-xl flex-1"
                  style={{ background: "var(--color-sky)" }}>{profile.invite_code}</div>
                <button
                  type="button"
                  aria-label={t("Copy invite code")}
                  title={t("Copy invite code")}
                  onClick={copyInviteCode}
                  className="shrink-0 rounded-xl flex flex-col items-center justify-center gap-1 px-3"
                  style={{
                    minWidth: 76,
                    background: copiedCode ? "var(--color-cream)" : "var(--color-card)",
                    border: "3px solid var(--color-rose)",
                    color: "var(--color-rose)",
                  }}
                >
                  {copiedCode ? <Check size={26} strokeWidth={3} /> : <Copy size={26} />}
                  <span className="text-xs font-bold leading-none whitespace-nowrap">
                    {copiedCode ? t("Copied!") : t("Copy")}
                  </span>
                </button>
              </div>
              {copiedCode && (
                <p className="text-sm font-extrabold mt-2" style={{ color: "var(--color-rose)" }}>
                  ✅ {t("Code copied!")}
                </p>
              )}
              <p className="text-sm mt-2" style={{ color: "var(--color-muted-foreground)" }}>
                {t("Share this with up to 5 family members. Each can link to you with this same code.")}
              </p>
              <button
                type="button"
                className="btn-secondary w-full mt-3"
                disabled={regenerating}
                onClick={() => setConfirmNewCode(true)}
              >
                {regenerating ? t("Generating…") : t("Generate new code")}
              </button>
            </div>
          )}
          {confirmNewCode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,0.5)" }}>
              <div className="card-soft w-full max-w-md" style={{ background: "var(--color-card)" }}>
                <h2 className="mb-2">⚠️ {t("Generate a new invite code?")}</h2>
                <p className="mb-4">
                  {t("This will invalidate your current code. All existing guardians will need to re-enter your new code.")}
                </p>
                <div className="flex gap-3">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setConfirmNewCode(false)}>
                    {t("Cancel")}
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1"
                    disabled={regenerating}
                    onClick={regenerateInviteCode}
                  >
                    {regenerating ? t("Generating…") : t("Yes, generate new code")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isSenior && (
          <>
            <FamilyCodeCard />

            <FamilyCodeExplainer />

            <div className="card-soft">
              <h2 className="mb-2">
                {t("My Guardians:")} {guardians.length}/5
                {guardians.length < 5 && (
                  <span className="text-sm font-normal" style={{ color: "var(--color-muted-foreground)" }}>
                    {" "}— {5 - guardians.length} {5 - guardians.length === 1 ? t("slot available") : t("slots available")}
                  </span>
                )}
              </h2>
              <div
                className="rounded-xl p-3 mb-3"
                style={{ background: "var(--color-cream)", border: "2px solid var(--color-rose)" }}
              >
                <p className="font-bold" style={{ fontSize: 15 }}>
                  🔑 {t("Share your family code word with your trusted guardians by phone or in person — never by text or email. If someone cannot say your code word, do not share personal information with them.")}
                </p>
              </div>
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
                          onClick={() => setConfirmRemoveGuardian(g)}
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

            {confirmRemoveGuardian && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => !removingGuardian && setConfirmRemoveGuardian(null)}
              >
                <div
                  className="card-soft w-full max-w-md"
                  style={{ background: "var(--color-card)", border: "3px solid #E74C3C" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-extrabold" style={{ fontSize: 20, color: "#E74C3C" }}>
                    {t("Remove guardian?")}
                  </p>
                  <p className="mt-2">
                    {lang === "es"
                      ? <>¿Está seguro de que desea quitar a <span className="font-bold">{confirmRemoveGuardian.full_name}</span> como su guardián?</>
                      : <>Are you sure you want to remove <span className="font-bold">{confirmRemoveGuardian.full_name}</span> as your guardian?</>}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      className="btn-big btn-primary flex-1" style={{ background: "transparent", border: "2px solid var(--color-tan)" }}
                      disabled={removingGuardian}
                      onClick={() => setConfirmRemoveGuardian(null)}
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      type="button"
                      className="btn-base flex-1"
                      style={{ background: "#E74C3C", color: "#fff" }}
                      disabled={removingGuardian}
                      onClick={removeGuardian}
                    >
                      {removingGuardian ? t("Removing…") : (lang === "es" ? "Quitar" : "Remove")}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              <p className="font-bold mb-2">{t("Text size")}</p>
              <div className="flex gap-2">
                <button className={`btn-base flex-1 ${profile.font_size==="large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("large")}>{t("Large")}</button>
                <button className={`btn-base flex-1 ${profile.font_size==="extra_large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("extra_large")}>{t("Extra Large")}</button>
              </div>
            </div>
          </>
        )}

        <Link to="/privacy" className="btn-base btn-outline w-full">{t("🔒 Privacy & Safety")}</Link>

        <button className="btn-base btn-outline w-full" onClick={() => askSignOut()}>
          {t("Sign Out")}
        </button>
        {signOutDialog}

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

function FamilyCodeCard() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const setCode = useServerFn(setFamilyCodeWord);
  const revealCode = useServerFn(revealFamilyCodeWord);
  const clearCode = useServerFn(clearFamilyCodeWord);

  const [firstLetter, setFirstLetter] = useState<string | null>(null);
  const [hasCode, setHasCode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(() => generatePassphrase());
  const [saving, setSaving] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("family_code_word_first_letter, family_code_word_set_at")
        .eq("id", profile.id)
        .maybeSingle();
      const fl = (data as any)?.family_code_word_first_letter ?? null;
      setFirstLetter(fl);
      setHasCode(!!fl);
    })();
  }, [profile]);

  const handleSave = async () => {
    const code = draft.trim();
    if (code.length < 2) { toast(t("Please enter a code word.")); return; }
    setSaving(true);
    try {
      const res = await setCode({ data: { codeWord: code } });
      setFirstLetter(res.firstLetter);
      setHasCode(true);
      setEditing(false);
      setDraft(generatePassphrase());
      toast(t("✅ Your family code word is saved."));
    } catch (e: any) {
      toast(e?.message || t("Could not save. Try again."));
    } finally { setSaving(false); }
  };

  const handleReveal = async () => {
    if (!password) return;
    setRevealing(true);
    try {
      const res = await revealCode({ data: { password } });
      setRevealed(res.codeWord);
      setPassword("");
    } catch (e: any) {
      toast(e?.message || t("Incorrect password."));
    } finally { setRevealing(false); }
  };

  const handleRemove = async () => {
    if (!confirm(t("Remove your family code word?"))) return;
    await clearCode({});
    setHasCode(false);
    setFirstLetter(null);
    setRevealed(null);
    toast(t("Code word removed."));
  };

  return (
    <div className="card-soft" style={{ borderTop: "6px solid var(--color-rose)" }}>
      <h2 className="mb-1">🔑 {t("Family Safety Code")}</h2>
      <p className="text-sm mb-3" style={{ color: "var(--color-muted-foreground)" }}>
        {t("When someone calls claiming to be family or an official, ask them to say your code word. If they cannot, treat that call with caution.")}
      </p>

      {!hasCode && !editing && (
        <button className="btn-base btn-primary w-full" onClick={() => { setDraft(generatePassphrase()); setEditing(true); }}>
          {t("Create my code word")}
        </button>
      )}

      {hasCode && !editing && (
        <>
          <div className="rounded-xl p-3 mb-3 text-center" style={{ background: "var(--color-cream)" }}>
            <p className="font-bold" style={{ fontSize: 18 }}>
              {t("Your code word is set — starts with")}{" "}
              <span style={{ fontSize: 24, color: "var(--color-rose)" }}>{firstLetter}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button className="btn-base btn-sky w-full" onClick={() => setRevealOpen(true)}>
              👁️ {t("Reveal code word")}
            </button>
            <button className="btn-base btn-outline w-full" onClick={() => { setDraft(generatePassphrase()); setEditing(true); }}>
              {t("Change code word")}
            </button>
            <button className="btn-base btn-outline w-full" onClick={handleRemove} style={{ color: "#E74C3C" }}>
              {t("Remove code word")}
            </button>
          </div>
        </>
      )}

      {editing && (
        <div className="space-y-3">
          <div>
            <label className="font-bold block mb-1">{t("Your code word")}</label>
            <input
              className="input-large w-full"
              style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.02em" }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="apple-river-sunset"
            />
            <button
              className="btn-base btn-outline w-full mt-2"
              onClick={() => setDraft(generatePassphrase())}
              type="button"
            >
              🎲 {t("Generate a new one")}
            </button>
            <p className="text-sm mt-2" style={{ color: "var(--color-muted-foreground)" }}>
              {t("Keep the suggested one, or type your own — something only your family would know.")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-base btn-outline" onClick={() => setEditing(false)} disabled={saving}>
              {t("Cancel")}
            </button>
            <button className="btn-base btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? t("Saving…") : t("Save")}
            </button>
          </div>
        </div>
      )}

      {revealOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => { if (!revealing) { setRevealOpen(false); setRevealed(null); setPassword(""); } }}
        >
          <div className="card-soft w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <p className="font-extrabold" style={{ fontSize: 20 }}>🔒 {t("Confirm it's you")}</p>
            {!revealed ? (
              <>
                <p className="mt-2">
                  {t("For your safety, enter your password to reveal your code word.")}
                </p>
                <input
                  type="password"
                  className="input-large w-full mt-3"
                  placeholder={t("Your password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button className="btn-base btn-outline" disabled={revealing}
                    onClick={() => { setRevealOpen(false); setPassword(""); }}>
                    {t("Cancel")}
                  </button>
                  <button className="btn-base btn-primary" disabled={revealing || !password}
                    onClick={handleReveal}>
                    {revealing ? t("Checking…") : t("Reveal")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl p-4 mt-3 text-center" style={{ background: "var(--color-cream)" }}>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--color-muted-foreground)" }}>
                    {t("Your code word")}
                  </p>
                  <p className="font-extrabold" style={{ fontSize: 26, color: "var(--color-rose)" }}>
                    {revealed}
                  </p>
                </div>
                <button className="btn-base btn-primary w-full mt-3"
                  onClick={() => { setRevealOpen(false); setRevealed(null); }}>
                  {t("Done")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FamilyCodeExplainer() {
  const { t } = useI18n();
  return (
    <div className="card-soft" style={{ background: "var(--color-cream)", borderTop: "6px solid var(--color-rose)" }}>
      <p className="font-bold" style={{ fontSize: 18 }}>{t("What is a family code word?")}</p>
      <p className="mt-1">{t("A short, private phrase your family shares — like apple-river-sunset — that only your real loved ones know.")}</p>
      <p className="font-bold mt-3">{t("Why AARP recommends it")}</p>
      <p className="mt-1">{t("AARP recommends a family code word to stop grandparent scams and impersonator scams. When a caller says they are your grandchild, your bank, or the police and pressures you for money or information, ask for the code word. A real loved one will know it. A scammer will not.")}</p>
      <p className="font-bold mt-3">{t("How to use it")}</p>
      <ul className="list-disc pl-5 mt-1 space-y-1">
        <li>{t("Create yours above with the \"Create my code word\" button.")}</li>
        <li>{t("Share it with trusted family by phone or in person — never by text or email.")}</li>
        <li>{t("If someone cannot say it, hang up and do not share personal information.")}</li>
      </ul>
    </div>
  );
}
