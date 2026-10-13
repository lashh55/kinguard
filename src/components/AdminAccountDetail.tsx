import { useEffect, useState } from "react";
import { getAccountDetail, sendAccountPasswordReset, changeTestAccountEmail } from "@/lib/adminAccounts.functions";

type Detail = Awaited<ReturnType<typeof getAccountDetail>>;

export function AdminAccountDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => getAccountDetail({ data: { userId } }).then(setD).catch((e) => setErr(e?.message ?? "Could not load account"));
  useEffect(() => { load(); }, [userId]);

  const parts = (d?.full_name ?? "").trim().split(/\s+/);
  const initial = parts.length > 1 ? parts[parts.length - 1].replace(".", "") : "—";
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "—";

  const doReset = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try { await sendAccountPasswordReset({ data: { userId, origin: window.location.origin } }); setMsg("Password reset email sent."); }
    catch (e: any) { setErr(e?.message ?? "Could not send reset email"); }
    finally { setBusy(false); setConfirmReset(false); }
  };
  const doChange = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try { await changeTestAccountEmail({ data: { userId, email: newEmail } }); setMsg("Email changed."); setNewEmail(""); await load(); }
    catch (e: any) { setErr(e?.message ?? "Could not change email"); }
    finally { setBusy(false); }
  };

  const row = (k: string, v: React.ReactNode) => (
    <div className="flex justify-between gap-4 border-t py-2"><dt className="font-bold">{k}</dt><dd className="text-right break-all">{v}</dd></div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="Account details" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Account details</h2>
          <button className="text-sm underline" onClick={onClose}>Close</button>
        </div>
        {!d && !err && <p className="text-sm opacity-70">Loading…</p>}
        {d && (
          <>
            <dl className="text-sm">
              {row("First name", first)}
              {row("Last initial", initial)}
              {row("Email", d.email || "—")}
              {row("Role", d.role)}
              {row("Account type", d.is_test ? "Test" : "Real")}
              {row("Created", new Date(d.created_at).toLocaleString())}
              {row("Last sign-in", d.last_sign_in_at ? new Date(d.last_sign_in_at).toLocaleString() : "Never")}
            </dl>
            <div className="mt-4 space-y-3">
              {!confirmReset ? (
                <button className="btn-base btn-outline w-full" disabled={busy} onClick={() => setConfirmReset(true)}>Send password reset email</button>
              ) : (
                <div className="rounded border p-3 space-y-2">
                  <p className="font-bold">Are you sure? A password reset email will be sent to this account.</p>
                  <div className="flex gap-2">
                    <button className="btn-base btn-primary flex-1" disabled={busy} onClick={doReset}>{busy ? "Sending…" : "Yes, send it"}</button>
                    <button className="btn-base btn-outline flex-1" disabled={busy} onClick={() => setConfirmReset(false)}>Cancel</button>
                  </div>
                </div>
              )}
              {d.is_test && (
                <div className="rounded border p-3 space-y-2">
                  <label className="block text-sm font-bold">Change email (test accounts only)
                    <input type="email" className="input-large mt-1" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" />
                  </label>
                  <button className="btn-base btn-outline w-full" disabled={busy || !newEmail} onClick={doChange}>Change email</button>
                </div>
              )}
            </div>
          </>
        )}
        {msg && <p className="mt-3 text-sm font-bold">{msg}</p>}
        {err && <p className="mt-3 text-sm font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
      </div>
    </div>
  );
}
