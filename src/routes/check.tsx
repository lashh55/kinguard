import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ScreenShell, scoreColor } from "@/components/ScreenShell";
import { analyzeScam } from "@/server/scam.functions";

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
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("email");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
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

  const verdict = result && (result.score <= 40 ? { label: "Looks Safe ✅", color: "var(--color-safe)" } :
    result.score <= 70 ? { label: "Use Caution ⚠️", color: "var(--color-warn)" } :
    { label: "Likely Scam 🚨", color: "var(--color-danger)" });

  return (
    <ScreenShell>
      <header className="px-5 py-4" style={{ background: "var(--color-sky)" }}>
        <h1>Check a Suspicious Message</h1>
        <p className="mt-1">Paste any suspicious email, text, or describe a phone call. We'll tell you if it's a scam.</p>
      </header>

      <form className="px-5 mt-5 space-y-4" onSubmit={submit}>
        <textarea
          className="input-large"
          rows={8}
          placeholder="Paste or type the suspicious message here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: 200, resize: "vertical" }}
        />
        <label className="block">
          <span className="block font-bold mb-2">What type is this?</span>
          <select className="input-large" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="email">Email</option>
            <option value="sms">Text Message</option>
            <option value="call">Phone Call</option>
            <option value="manual">Not Sure</option>
          </select>
        </label>
        <button className="btn-base btn-primary w-full" disabled={busy || !content.trim()}>
          {busy ? "ScamShield is analyzing this for you…" : "🔍 Check This Now"}
        </button>
        {err && <p className="font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
      </form>

      {result && verdict && (
        <section className="px-5 mt-6 space-y-4">
          {result.ssn_requested && (
            <div className="card-soft" style={{ background: "var(--color-danger)", color: "#fff" }}>
              <p className="font-extrabold" style={{ fontSize: 20 }}>🚨 SSN ALERT</p>
              <p className="mt-1">This message is asking for your Social Security Number. Do NOT share it until you use our SSN Shield checker.</p>
              <button className="btn-base btn-rose w-full mt-3" onClick={() => navigate({ to: "/ssn" })}>
                → Check This in SSN Shield
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
              <p className="font-bold mb-2">Red flags we found:</p>
              <ul className="space-y-2">
                {result.flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          <div className="card-soft" style={{ background: "var(--color-sky)" }}>
            <p className="font-bold mb-1">What to do:</p>
            <p style={{ fontSize: 19 }}>{result.recommendation}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button className="btn-base btn-sky" onClick={() => toast("✅ Your guardian has been notified")}>Alert My Guardian</button>
            <button className="btn-base btn-safe" onClick={() => toast("✅ Marked as safe")}>Mark as Safe</button>
            <button className="btn-base btn-primary" onClick={() => toast("✅ Sender blocked")}>Block This Sender</button>
          </div>

          <Link to="/dashboard" className="btn-base btn-outline w-full">← Back to dashboard</Link>
        </section>
      )}
    </ScreenShell>
  );
}
