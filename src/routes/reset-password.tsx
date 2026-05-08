import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/scamshield-logo.png";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash on load; wait for the PASSWORD_RECOVERY event or existing session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setErr("Passwords do not match"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } catch (e: any) {
      setErr(e?.message || "Could not update password");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="ScamShield logo" className="w-32 h-32 object-contain" />
          <h1 className="mt-2" style={{ color: "var(--color-rose)", fontSize: 32 }}>Reset Password</h1>
        </div>
        {done ? (
          <div className="card-soft text-center space-y-3">
            <h2>Password updated! ✅</h2>
            <p>Taking you to your dashboard…</p>
          </div>
        ) : !ready ? (
          <div className="card-soft text-center space-y-3">
            <p>Open this page from the password reset link in your email.</p>
            <button className="btn-base btn-outline w-full" onClick={() => navigate({ to: "/" })}>Back to sign in</button>
          </div>
        ) : (
          <form onSubmit={submit} className="card-soft space-y-4">
            <label className="block">
              <span className="block font-bold mb-2">New password</span>
              <input className="input-large" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="block">
              <span className="block font-bold mb-2">Confirm new password</span>
              <input className="input-large" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {err && <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
            <button className="btn-base btn-primary w-full" disabled={busy}>
              {busy ? "Saving…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
