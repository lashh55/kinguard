import { pageHead } from "@/lib/pageHead";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { generatePassphrase } from "@/lib/passphrase";
import logo from "@/assets/kinguard-logo.png";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Reset your password", "Choose a strong new password for your KinGuard account."),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleGenerate = async () => {
    const pw = generatePassphrase();
    setPassword(pw);
    setConfirm(pw);
    setGenerated(true);
    setCopied(false);
    try { await navigator.clipboard.writeText(pw); setCopied(true); } catch { /* user can copy manually */ }
  };
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(password); setCopied(true); } catch { /* noop */ }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 10) { setErr(t("Password must be at least 10 characters")); return; }
    if (password !== confirm) { setErr(t("Passwords do not match")); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } catch (e: any) {
      setErr(e?.message || t("Could not update password"));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="KinGuard logo" className="w-32 h-32 object-contain" />
          <h1 className="mt-2" style={{ color: "var(--color-rose)", fontSize: 32 }}>{t("Reset Password")}</h1>
        </div>
        {done ? (
          <div className="card-soft text-center space-y-3">
            <h2>{t("Password updated! ✅")}</h2>
            <p>{t("Taking you to your dashboard…")}</p>
          </div>
        ) : !ready ? (
          <div className="card-soft text-center space-y-3">
            <p>{t("Open this page from the password reset link in your email.")}</p>
            <button className="btn-base btn-outline w-full" onClick={() => navigate({ to: "/" })}>{t("Back to sign in")}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="card-soft space-y-4">
            <label className="block">
              <span className="block font-bold mb-2">{t("New password")}</span>
              <PasswordInput
                required
                minLength={10}
                value={password}
                forceVisible={generated}
                onChange={(e) => { setPassword(e.target.value); setGenerated(false); setCopied(false); }}
              />
              <PasswordStrengthMeter value={password} />
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <button type="button" className="text-sm underline font-semibold" onClick={handleGenerate}>
                  {t("Generate a strong password for me")}
                </button>
                {generated && password && (
                  <button type="button" className="text-sm underline" onClick={handleCopy}>
                    {copied ? t("Copied!") : t("Copy")}
                  </button>
                )}
              </div>
              {generated && (
                <p className="text-sm font-bold mt-2" style={{ color: "var(--color-danger)" }}>
                  {t("Write this down somewhere safe before continuing.")}
                </p>
              )}
            </label>
            <label className="block">
              <span className="block font-bold mb-2">{t("Confirm new password")}</span>
              <PasswordInput required minLength={10} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {err && <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
            <button className="btn-base btn-primary w-full" disabled={busy}>
              {busy ? t("Saving…") : t("Update Password")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
