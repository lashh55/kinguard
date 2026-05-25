import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { normalizeStats } from "@/lib/badges";
import { SsnDisclaimer } from "@/components/SsnDisclaimer";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/ssn")({
  component: SsnShield,
});

type Asker = "employer" | "bank" | "irs" | "website" | "phone" | "email" | "unsure";
type Direction = "self" | "them";

const ASKERS: { id: Asker; label: string; icon: string }[] = [
  { id: "employer", label: "My Employer or HR", icon: "👔" },
  { id: "bank", label: "My Bank or Credit Union", icon: "🏦" },
  { id: "irs", label: "The IRS or Social Security Office", icon: "🏛️" },
  { id: "website", label: "A Website I Found Online", icon: "🌐" },
  { id: "phone", label: "Someone Who Called Me", icon: "📞" },
  { id: "email", label: "An Email or Text Message", icon: "📧" },
  { id: "unsure", label: "I'm Not Sure", icon: "❓" },
];

type Verdict = { level: "safe" | "warn" | "danger"; title: string; body: string };

function decide(a: Asker, d: Direction): Verdict {
  if (a === "employer")
    return { level: "safe", title: "✅ SAFE", body: "Employers are legally required to collect your SSN for payroll and taxes. This is normal and safe.\n\n💡 Tip: Always make sure the email asking for your information comes from your official employer email address (example: name@yourcompany.com). If you are unsure, contact your HR department directly by phone before responding." };
  if (a === "bank" && d === "self")
    return { level: "safe", title: "✅ SAFE", body: "Banks need your SSN to verify your identity. Since you called them, this is safe." };
  if (a === "bank" && d === "them")
    return { level: "warn", title: "⚠️ CAUTION", body: "Your bank would not call asking for your full SSN out of the blue. Call the number on the back of your card to verify before sharing anything." };
  if (a === "irs")
    return { level: "warn", title: "⚠️ CAUTION", body: "The IRS and Social Security Administration contact you by MAIL first — never by phone or email. If someone called or emailed you claiming to be the IRS, hang up. Call 1-800-829-1040 to verify." };
  if (a === "website")
    return { level: "danger", title: "🚨 STOP", body: "Do not enter your SSN on any website until you verify it is legitimate. Look for a padlock icon and .gov or a known company domain only. When in doubt, call the company directly." };
  if (a === "phone")
    return { level: "danger", title: "🚨 DANGER", body: "This is one of the most common scam tactics. Hang up immediately. No legitimate organization needs your SSN over an unexpected phone call." };
  if (a === "email")
    return { level: "danger", title: "🚨 DANGER", body: "Never share your SSN by email or text. Legitimate organizations do not ask for your SSN this way. This is almost certainly a scam." };
  return { level: "warn", title: "⚠️ CAUTION", body: "When in doubt, don't share it. Call your guardian or a trusted family member before doing anything." };
}

function levelColor(l: "safe" | "warn" | "danger") {
  return l === "safe" ? "var(--color-safe)" : l === "warn" ? "var(--color-warn)" : "var(--color-danger)";
}

const IRS_STEPS = [
  { id: "irs_visit", label: "Go to IRS.gov/IPPIN", url: "https://www.irs.gov/identity-theft-fraud-scams/get-an-identity-protection-pin" },
  { id: "irs_account", label: "Create or sign in to your IRS Online Account" },
  { id: "irs_verify", label: "Verify your identity with ID.me (photo ID required)" },
  { id: "irs_pin", label: "Receive your 6-digit IP PIN" },
  { id: "irs_save", label: "Write it down and store it somewhere safe" },
  { id: "irs_use", label: "Use it on your next tax return" },
];

const BUREAUS = [
  { id: "equifax", name: "Equifax", url: "https://www.equifax.com/personal/credit-report-services/credit-freeze/", phone: "1-800-349-9960", icon: "🟥" },
  { id: "experian", name: "Experian", url: "https://www.experian.com/freeze/center.html", phone: "1-888-397-3742", icon: "🟦" },
  { id: "transunion", name: "TransUnion", url: "https://www.transunion.com/credit-freeze", phone: "1-888-909-8872", icon: "🟩" },
];

function SsnShield() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [asker, setAsker] = useState<Asker | null>(null);
  const [dir, setDir] = useState<Direction | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (profile?.ssn_shield_progress) setProgress(profile.ssn_shield_progress as any);
  }, [profile]);

  const verdict = asker && (asker === "unsure" || dir) ? decide(asker, dir ?? "them") : null;
  const reset = () => { setAsker(null); setDir(null); };

  const toggle = async (key: string) => {
    const next = { ...progress, [key]: !progress[key] };
    setProgress(next);
    if (profile?.id) {
      await supabase.from("profiles").update({ ssn_shield_progress: next }).eq("id", profile.id);
      if (next[key]) toast(t("✅ Step marked complete"));

      const allDone =
        IRS_STEPS.every((s) => next[s.id]) &&
        BUREAUS.every((b) => next[`freeze_${b.id}`]);
      if (allDone && profile.role === "senior") {
        const stats = normalizeStats(profile.challenge_stats);
        if (!stats.badges_earned.includes("ssn_hero")) {
          const updated = { ...stats, badges_earned: [...stats.badges_earned, "ssn_hero"] };
          await supabase.from("profiles").update({ challenge_stats: updated as any }).eq("id", profile.id);
          toast(t("🛡️ You earned the SSN Hero badge!"));
        }
      }
      refreshProfile?.();
    }
  };

  const irsDone = IRS_STEPS.filter((s) => progress[s.id]).length;
  const freezeDone = BUREAUS.filter((b) => progress[`freeze_${b.id}`]).length;

  return (
    <ScreenShell>
      <section className="px-5 pt-4">
        <SsnDisclaimer />
      </section>
      <header className="px-5 pt-4 pb-3">
        <h1 style={{ color: "var(--color-rose)" }}>{t("🛡️ SSN Shield")}</h1>
        <p className="mt-1">{t("You have the power to protect yourself. We'll show you how.")}</p>
      </header>

      {/* Should I Share */}
      <section className="px-5">
        <div className="card-soft" style={{ borderLeft: "6px solid var(--color-rose)" }}>
          <h2 style={{ color: "var(--color-rose)" }}>{t("Should I Share My SSN?")}</h2>
          <p className="mt-1">{t("Answer two quick questions and we'll tell you if it's safe.")}</p>

          {!asker && (
            <div className="mt-4 space-y-2">
              <p className="font-bold">{t("Who is asking for your SSN?")}</p>
              {ASKERS.map((a) => (
                <button key={a.id} className="btn-base btn-sky w-full justify-start text-left" onClick={() => setAsker(a.id)}>
                  <span className="mr-2">{a.icon}</span> {t(a.label)}
                </button>
              ))}
            </div>
          )}

          {asker && asker !== "unsure" && !dir && (
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl px-4 py-3 text-center font-extrabold" style={{ background: "#ACD0DC", fontSize: 17 }}>
                {t("You selected:")} {t(ASKERS.find((a) => a.id === asker)?.label || "")}
              </div>
              <p className="font-bold">{t("Did YOU contact them first, or did they contact you?")}</p>
              <button className="btn-base btn-sky w-full" onClick={() => setDir("self")}>{t("✅ I contacted them first")}</button>
              <button className="btn-base btn-sky w-full" onClick={() => setDir("them")}>{t("⚠️ They contacted me")}</button>
              <button className="text-sm underline w-full mt-1" onClick={reset}>{t("← Start over")}</button>
            </div>
          )}

          {verdict && (
            <div className="mt-4 space-y-3">
              {asker && asker !== "unsure" && (
                <div className="rounded-2xl px-4 py-3 text-center font-extrabold" style={{ background: "#ACD0DC", fontSize: 17 }}>
                  {t("You selected:")} {t(ASKERS.find((a) => a.id === asker)?.label || "")}
                </div>
              )}
              {dir && (
                <div className="rounded-2xl px-4 py-3 text-center font-extrabold" style={{ background: "#ACD0DC", fontSize: 17 }}>
                  {t("You selected:")} {dir === "self" ? t("I contacted them first") : t("They contacted me")}
                </div>
              )}
              <div className="rounded-2xl p-4 text-white" style={{ background: levelColor(verdict.level) }}>
                <p className="font-extrabold" style={{ fontSize: 22 }}>{t(verdict.title)}</p>
                <p className="mt-2" style={{ fontSize: 18, whiteSpace: "pre-line" }}>{t(verdict.body)}</p>
              </div>
              {verdict.level === "safe" ? (
                <button className="btn-base btn-safe w-full" onClick={reset}>{t("I'm Safe, Thanks")}</button>
              ) : (
                <button className="btn-base btn-rose w-full" onClick={() => toast(t("✅ Your guardian has been notified"))}>
                  {t("Alert My Guardian")}
                </button>
              )}
              <button className="btn-base btn-outline w-full" onClick={reset}>{t("Check another")}</button>
            </div>
          )}
        </div>
      </section>

      {/* IRS IP PIN */}
      <section className="px-5 mt-4">
        <div className="card-soft" style={{ borderLeft: "6px solid var(--color-tan)" }}>
          <div className="flex items-start justify-between gap-3">
            <h2>{t("📌 IRS Identity Protection PIN")}</h2>
            <span className="font-bold text-sm whitespace-nowrap" style={{ color: "var(--color-tan)" }}>
              {irsDone}/{IRS_STEPS.length}
            </span>
          </div>
          <p className="mt-1">{t("A free 6-digit PIN from the IRS that blocks scammers from filing a tax return in your name.")}</p>

          <div className="card-soft mt-3" style={{ background: "var(--color-cream)", boxShadow: "none" }}>
            <p className="font-bold">{t("💡 Why this matters")}</p>
            <p className="mt-1">{t("Tax-return identity theft costs seniors billions every year. The IP PIN is the single best protection — and it's free.")}</p>
          </div>

          {/* Progress bar */}
          <div className="mt-3 rounded-full overflow-hidden" style={{ background: "#EFE6D4", height: 10 }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${(irsDone / IRS_STEPS.length) * 100}%`, background: "#DFC18F" }}
            />
          </div>

          <ol className="mt-4 space-y-2">
            {IRS_STEPS.map((s, i) => {
              const done = !!progress[s.id];
              return (
                <li key={s.id}>
                  <button
                    onClick={() => toggle(s.id)}
                    className="w-full text-left flex items-start gap-3 rounded-2xl p-3 border-2 transition-colors"
                    style={{
                      borderColor: done ? "#2ECC71" : "var(--color-border)",
                      background: done ? "#2ECC71" : "#fff",
                      color: done ? "#fff" : undefined,
                    }}
                  >
                    <span
                      className="flex-shrink-0 rounded-full flex items-center justify-center font-extrabold"
                      style={{
                        width: 36, height: 36,
                        background: done ? "#2ECC71" : "var(--color-tan)",
                        color: "#fff",
                        border: done ? "2px solid #fff" : "none",
                      }}
                    >
                      {done ? <span key="check" className="inline-block animate-scale-in">✓</span> : i + 1}
                    </span>
                    <span className="font-bold pt-1" style={{ fontSize: 17, color: done ? "#fff" : undefined }}>{t(s.label)}</span>
                  </button>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn-base btn-sky w-full mt-2">
                      {t("→ Open IRS.gov/IPPIN")}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>

          {irsDone === IRS_STEPS.length && (
            <div className="rounded-2xl p-4 mt-4 text-white font-bold text-center" style={{ background: "#2ECC71", fontSize: 17 }}>
              {t("🎉 All steps complete! Your IRS PIN is set up. You're protected!")}
            </div>
          )}
        </div>
      </section>

      {/* Credit Freeze */}
      <section className="px-5 mt-4">
        <div className="card-soft" style={{ borderLeft: "6px solid var(--color-sky)" }}>
          <div className="flex items-start justify-between gap-3">
            <h2>{t("🧊 Freeze Your Credit")}</h2>
            <span className="font-bold text-sm whitespace-nowrap" style={{ color: "var(--color-sky)" }}>
              {freezeDone}/3
            </span>
          </div>
          <p className="mt-1">{t("A credit freeze stops anyone from opening new accounts in your name. It's free, and you can unfreeze it anytime.")}</p>

          <div className="card-soft mt-3" style={{ background: "var(--color-cream)", boxShadow: "none" }}>
            <p className="font-bold">{t("💡 You must freeze at all 3 bureaus")}</p>
            <p className="mt-1">{t("Equifax, Experian, and TransUnion all keep separate files. Freeze each one.")}</p>
          </div>

          <div className="mt-4 space-y-3">
            {BUREAUS.map((b) => {
              const key = `freeze_${b.id}`;
              const done = !!progress[key];
              return (
                <div key={b.id} className="rounded-2xl p-3 border-2" style={{
                  borderColor: done ? "#2ECC71" : "var(--color-border)",
                  background: done ? "#EAFAF1" : "#fff",
                }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{b.icon}</span>
                      <span className="font-extrabold" style={{ fontSize: 19 }}>{b.name}</span>
                    </div>
                    {done && <span className="font-bold" style={{ color: "#2ECC71" }}>{t("✓ Done")}</span>}
                  </div>
                  <p className="mt-1 text-sm">📞 {b.phone}</p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="btn-base btn-sky w-full">
                      {t("→ Freeze on")} {b.name}
                    </a>
                    <button
                      className="btn-base w-full"
                      style={done ? { background: "#2ECC71", color: "#fff" } : undefined}
                      onClick={() => toggle(key)}
                    >
                      {done ? t("✅ Frozen — Done!") : t("I froze it ✓")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {freezeDone === 3 && (
            <div className="rounded-2xl p-4 mt-4 text-white" style={{ background: "#2ECC71" }}>
              <p className="font-extrabold" style={{ fontSize: 20 }}>{t("🛡️ Excellent!")}</p>
              <p className="mt-1">{t("All three credit bureaus are frozen. Your credit is now protected even if someone has your Social Security Number.")}</p>
            </div>
          )}
        </div>
      </section>

      <p className="text-center text-sm mt-6 mb-2 px-5" style={{ color: "var(--color-muted-foreground)" }}>
        {t("🔒 KinGuard never requires, stores, or transmits your Social Security Number. We only help you protect it.")}
      </p>
    </ScreenShell>
  );
}
