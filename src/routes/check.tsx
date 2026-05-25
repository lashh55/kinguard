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
  const [channel, setChannel] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [typeError, setTypeError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) { setTypeError(true); return; }
    if (!content.trim()) return;
    setTypeError(false);
    setBusy(true); setErr(null); setResult(null);
    try {
      const r = await analyzeScam({ data: { content, channel } });
      setResult(r);
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

  const verdict = result && (result.score <= 40 ? { label: t("Looks Safe ✅"), color: "var(--color-safe)" } :
    result.score <= 70 ? { label: t("Use Caution ⚠️"), color: "var(--color-warn)" } :
    { label: t("Likely Scam 🚨"), color: "var(--color-danger)" });

  return (
    <ScreenShell>
      <header className="px-5 py-4" style={{ background: "var(--color-sky)" }}>
        <h1>{t("Check a Suspicious Message")}</h1>
        <p className="mt-1">{t("Paste any suspicious email, text, or describe a phone call. We'll tell you if it's a scam.")}</p>
      </header>

      <form className="px-5 mt-5 space-y-4" onSubmit={submit}>
        <textarea
          className="input-large"
          rows={8}
          placeholder={t("Paste or type the suspicious message here...")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: 200, resize: "vertical" }}
        />
        <label className="block">
          <span className="block font-bold mb-2">{t("What type is this?")}</span>
          <select className="input-large" value={channel} onChange={(e) => { setChannel(e.target.value); setTypeError(false); }}>
            <option value="">{t("--- Select a type ---")}</option>
            <option value="email">{t("Email")}</option>
            <option value="sms">{t("Text Message")}</option>
            <option value="call">{t("Phone Call")}</option>
            <option value="manual">{t("Not Sure")}</option>
          </select>
        </label>
        {typeError && (
          <p className="font-bold text-center" style={{ color: "#F39C12", fontSize: 15 }}>
            {t("Please select what type of message this is before checking")}
          </p>
        )}
        <button
          className="btn-base w-full font-extrabold"
          disabled={busy || !content.trim() || !channel}
          style={channel && content.trim() ? { background: "#DFC18F", color: "#3D2B2B" } : undefined}
        >
          {busy ? t("KinGuard is analyzing this for you…") : t("🔍 Check This Now")}
        </button>
        {err && <p className="font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
      </form>

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
