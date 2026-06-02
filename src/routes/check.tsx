import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ScreenShell, scoreColor } from "@/components/ScreenShell";
import { analyzeScam } from "@/server/scam.functions";
import { notifyGuardianScam } from "@/lib/guardianAlerts";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/check")({
  component: CheckScreen,
});

type Result = {
  score: number;
  type: string;
  flags: string[];
  recommendation: string;
  urgency: string;
  ssn_requested: boolean;
};

function CheckScreen() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const FORWARD_EMAIL = "check@check.getkinguard.com";
  const channel = "manual";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true); setErr(null); setResult(null);
    try {
      const r = await analyzeScam({ data: { content, channel } });
      setResult(r);
      track("suspicious_message_checked", { channel, score: r.score, scam_type: r.type, ssn_requested: r.ssn_requested });
      if (profile) {
        await supabase.from("scam_alerts").insert({
          senior_id: profile.id,
          channel: r.ssn_requested ? "ssn_request" : channel,
          content_preview: content.slice(0, 200),
          scam_score: r.score,
          scam_type: r.type,
          scam_flags: r.flags,
          ai_recommendation: r.recommendation,
          ai_urgency: r.urgency,
          status: "flagged",
        });
      }
    } catch (e: any) {
      setErr(e?.message || "Could not analyze. Please try again.");
    } finally { setBusy(false); }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(FORWARD_EMAIL);
      setCopied(true);
      toast(t("✅ Email address copied"));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast(t("Could not copy. Please type the address manually."));
    }
  };

  const verdict = result && (result.score <= 40 ? { label: t("Looks Safe ✅"), color: "var(--color-safe)" } :
    result.score <= 70 ? { label: t("Use Caution ⚠️"), color: "var(--color-warn)" } :
    { label: t("Likely Scam 🚨"), color: "var(--color-danger)" });

  return (
    <ScreenShell>
      <header className="px-5 py-4" style={{ background: "var(--color-sky)" }}>
        <h1>{t("Check a Suspicious Message")}</h1>
        <p className="mt-1">{t("Forward a suspicious email to us, or paste a text message or describe a phone call below. KinGuard will tell you if it's a scam.")}</p>
      </header>

      <section className="px-5 mt-5">
        <div className="card-soft" style={{ background: "var(--color-sky)" }}>
          <p className="font-extrabold" style={{ fontSize: 20 }}>{t("📧 Got a suspicious email?")}</p>
          <p className="mt-2" style={{ fontSize: 18 }}>
            {t("Just forward it to the address below. No copying or pasting needed. KinGuard will check it and alert you and your guardians right away.")}
          </p>
          <div
            className="mt-3 rounded-xl px-4 py-3 font-extrabold text-center break-all"
            style={{ background: "#fff", color: "#3D2B2B", fontSize: 22, border: "2px dashed #3D2B2B" }}
          >
            {FORWARD_EMAIL}
          </div>
          <button
            type="button"
            onClick={copyEmail}
            className="btn-base w-full mt-3 font-extrabold"
            style={{ background: "#DFC18F", color: "#3D2B2B" }}
          >
            {copied ? t("✅ Copied!") : t("📋 Copy email address")}
          </button>
          <p className="mt-3" style={{ fontSize: 16 }}>
            {t("Open the suspicious email in your inbox, tap Forward, and send it to this address. That's all you need to do.")}
          </p>
        </div>
      </section>

      <div className="px-5 mt-6 flex items-center gap-3" aria-hidden="true">
        <div style={{ flex: 1, height: 1, background: "#3D2B2B33" }} />
        <span className="font-bold" style={{ fontSize: 16 }}>{t("OR PASTE BELOW")}</span>
        <div style={{ flex: 1, height: 1, background: "#3D2B2B33" }} />
      </div>

      <form className="px-5 mt-4 space-y-4" onSubmit={submit}>
        <p className="font-bold" style={{ fontSize: 18 }}>
          {t("For text messages, phone calls, or someone at your door — paste or type what they said here:")}
        </p>
        <textarea
          className="input-large"
          rows={8}
          placeholder={t("Paste or type the suspicious message here...")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: 200, resize: "vertical" }}
        />
        <button
          className="btn-base w-full font-extrabold"
          disabled={busy || !content.trim()}
          style={content.trim() ? { background: "#DFC18F", color: "#3D2B2B" } : undefined}
        >
          {busy ? t("KinGuard is analyzing this for you…") : t("🔍 Check This Now")}
        </button>
        {err && <p className="font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
      </form>

      <section className="px-5 mt-6">
        <details className="card-soft" style={{ background: "#FFF8EC" }}>
          <summary className="font-extrabold cursor-pointer" style={{ fontSize: 20 }}>
            {t("How do I copy and paste?")}
          </summary>
          <div className="mt-4 space-y-4" style={{ fontSize: 18 }}>
            <div>
              <p className="font-extrabold mb-1">{t("📱 On a phone or tablet")}</p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>{t("Press and hold your finger on the message until words become highlighted.")}</li>
                <li>{t("Drag the little blue dots to cover all the text you want.")}</li>
                <li>{t("Tap \"Copy\" in the small menu that appears.")}</li>
                <li>{t("Come back to this page, press and hold inside the box above, then tap \"Paste\".")}</li>
              </ol>
            </div>
            <div>
              <p className="font-extrabold mb-1">{t("💻 On a computer")}</p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>{t("Click at the start of the message, hold the mouse button, and drag to the end to highlight it.")}</li>
                <li>{t("Press the Ctrl key and the C key at the same time (on a Mac, use Command + C).")}</li>
                <li>{t("Click inside the box above on this page.")}</li>
                <li>{t("Press Ctrl + V (on a Mac, Command + V) to paste it in.")}</li>
              </ol>
            </div>
          </div>
        </details>
      </section>


      {result && verdict && (
        <section className="px-5 mt-6 space-y-4">
          {result.ssn_requested && (
            <div className="card-soft" style={{ background: "var(--color-danger)", color: "#fff" }}>
              <p className="font-extrabold" style={{ fontSize: 20 }}>{t("🚨 SSN ALERT")}</p>
              <p className="mt-1">{t("This message is asking for your Social Security Number. Do NOT share it until you use our SSN Shield checker.")}</p>
              <button className="btn-base btn-rose w-full mt-3" onClick={() => navigate({ to: "/ssn" })}>
                {t("→ Check This in SSN Shield")}
              </button>
            </div>
          )}

          <div className="card-soft text-center">
            <div
              className="mx-auto rounded-full flex items-center justify-center font-extrabold text-white"
              style={{ width: 140, height: 140, background: scoreColor(result.score), fontSize: 48 }}
            >
              {result.score}
            </div>
            <p className="mt-3 font-extrabold" style={{ fontSize: 22, color: scoreColor(result.score) }}>{verdict.label}</p>
            <p className="font-bold mt-1">{result.type}</p>
          </div>

          {result.flags.length > 0 && (
            <div className="card-soft">
              <p className="font-bold mb-2">{t("Red flags we found:")}</p>
              <ul className="space-y-2">
                {result.flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          <div className="card-soft" style={{ background: "var(--color-sky)" }}>
            <p className="font-bold mb-1">{t("What to do:")}</p>
            <p style={{ fontSize: 19 }}>{result.recommendation}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button className="btn-base btn-sky" onClick={() => {
              if (result && profile) notifyGuardianScam({
                seniorName: profile.full_name,
                scamType: result.type,
                score: result.score,
                channel,
              });
              toast(t("✅ Your guardian has been notified"));
            }}>{t("Alert My Guardian")}</button>
            <button className="btn-base btn-safe" onClick={() => toast(t("✅ Marked as safe"))}>{t("Mark as Safe")}</button>
            <button className="btn-base btn-primary" onClick={() => toast(t("✅ Sender blocked"))}>{t("Block This Sender")}</button>
          </div>

          <Link to="/dashboard" className="btn-base btn-outline w-full">{t("← Back to dashboard")}</Link>
        </section>
      )}
    </ScreenShell>
  );
}
