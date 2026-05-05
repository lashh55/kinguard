import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenShell } from "@/components/ScreenShell";

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
    return { level: "safe", title: "✅ SAFE", body: "Employers are legally required to collect your SSN for payroll and taxes. This is normal and safe." };
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

function SsnShield() {
  const [asker, setAsker] = useState<Asker | null>(null);
  const [dir, setDir] = useState<Direction | null>(null);

  const verdict = asker && (asker === "unsure" || dir) ? decide(asker, dir ?? "them") : null;

  const reset = () => { setAsker(null); setDir(null); };

  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3">
        <h1 style={{ color: "var(--color-rose)" }}>🛡️ SSN Shield</h1>
        <p className="mt-1">You have the power to protect yourself. We'll show you how.</p>
      </header>

      <section className="px-5">
        <div className="card-soft" style={{ borderLeft: "6px solid var(--color-rose)" }}>
          <h2 style={{ color: "var(--color-rose)" }}>Should I Share My SSN?</h2>
          <p className="mt-1">Answer two quick questions and we'll tell you if it's safe.</p>

          {!asker && (
            <div className="mt-4 space-y-2">
              <p className="font-bold">Who is asking for your SSN?</p>
              {ASKERS.map((a) => (
                <button key={a.id} className="btn-base btn-sky w-full justify-start text-left"
                  onClick={() => setAsker(a.id)}>
                  <span className="mr-2">{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          )}

          {asker && asker !== "unsure" && !dir && (
            <div className="mt-4 space-y-2">
              <p className="font-bold">Did YOU contact them first, or did they contact you?</p>
              <button className="btn-base btn-sky w-full" onClick={() => setDir("self")}>✅ I contacted them first</button>
              <button className="btn-base btn-sky w-full" onClick={() => setDir("them")}>⚠️ They contacted me</button>
              <button className="text-sm underline w-full mt-1" onClick={reset}>← Start over</button>
            </div>
          )}

          {verdict && (
            <div className="mt-4 space-y-3">
              <div
                className="rounded-2xl p-4 text-white"
                style={{ background: levelColor(verdict.level) }}
              >
                <p className="font-extrabold" style={{ fontSize: 22 }}>{verdict.title}</p>
                <p className="mt-2" style={{ fontSize: 18 }}>{verdict.body}</p>
              </div>
              {verdict.level === "safe" ? (
                <button className="btn-base btn-safe w-full" onClick={reset}>I'm Safe, Thanks</button>
              ) : (
                <button className="btn-base btn-rose w-full" onClick={() => alert("Your guardian has been notified.")}>
                  Alert My Guardian
                </button>
              )}
              <button className="btn-base btn-outline w-full" onClick={reset}>Check another</button>
            </div>
          )}
        </div>
      </section>

      <section className="px-5 mt-4">
        <div className="card-soft" style={{ borderLeft: "6px solid var(--color-tan)" }}>
          <h2>📌 IRS Identity Protection PIN</h2>
          <p className="mt-1">Coming soon — a step-by-step checklist to set up the IRS's free 6-digit PIN that blocks tax-return fraud.</p>
        </div>
      </section>

      <section className="px-5 mt-4">
        <div className="card-soft" style={{ borderLeft: "6px solid var(--color-sky)" }}>
          <h2>🧊 Freeze Your Credit</h2>
          <p className="mt-1">Coming soon — guided links and progress tracking for Equifax, Experian, and TransUnion.</p>
        </div>
      </section>

      <p className="text-center text-sm mt-6 px-5" style={{ color: "var(--color-muted-foreground)" }}>
        🔒 ScamShield never stores or transmits your Social Security Number. We only help you protect it.
      </p>
    </ScreenShell>
  );
}
