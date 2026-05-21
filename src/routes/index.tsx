import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PhotoPanel } from "@/components/PhotoPanel";
import { formatPhone, isValidPhone } from "@/lib/phone";
import logo from "@/assets/kinguard-logo.png";
import { useI18n, LanguageToggle } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Onboarding,
});

type Step = "role" | "senior" | "guardian" | "invite" | "linked";

function Onboarding() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && profile) navigate({ to: "/dashboard" });
  }, [loading, user, profile, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen relative">
      <PhotoPanel widthPct={35} />
      <div className="sm:w-[65%]">
        <div className="px-5 py-8 max-w-xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <img src={logo} alt="KinGuard logo" className="w-44 h-44 object-contain" />
            <h1 className="mt-2" style={{ color: "var(--color-rose)", fontSize: 38 }}>KinGuard</h1>
            <p className="mt-1" style={{ color: "var(--color-rose)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 14, fontWeight: 700 }}>
              Protecting the people you love
            </p>
          </div>

          <div className="mt-8">
            {step === "role" && <RoleStep onPick={setStep} />}
            {step === "senior" && <SeniorForm onCreated={(c) => { setCode(c); setStep("invite"); }} onBack={() => setStep("role")} />}
            {step === "guardian" && <GuardianForm onLinked={() => setStep("linked")} onBack={() => setStep("role")} />}
            {step === "invite" && <InviteCodeView code={code!} onContinue={() => navigate({ to: "/dashboard" })} />}
            {step === "linked" && <LinkedView onContinue={() => navigate({ to: "/dashboard" })} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleStep({ onPick }: { onPick: (s: Step) => void }) {
  return (
    <div className="space-y-4">
      <button className="btn-base btn-sky w-full" onClick={() => onPick("senior")}>
        🛡️ I want to be protected
      </button>
      <button className="btn-base btn-primary w-full" onClick={() => onPick("guardian")}>
        💙 I want to protect someone
      </button>
      <p className="text-center italic px-2" style={{ color: "#3D2B2B", fontSize: 16 }}>
        You will need an invite code from the person you want to protect. Ask them to create their account first — they will receive a code to share with you.
      </p>
      <p className="text-center text-sm mt-2" style={{ color: "var(--color-muted-foreground)" }}>
        Already have an account?{" "}
        <button className="underline font-bold" onClick={() => onPick("senior")}>Sign in below</button>
      </p>
    </div>
  );
}

function FormRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block font-bold mb-2">{label}</span>
      {children}
      {hint && <span className="block text-sm italic mt-1" style={{ color: "var(--color-muted-foreground)" }}>{hint}</span>}
    </label>
  );
}

function SeniorForm({ onCreated, onBack }: { onCreated: (code: string) => void; onBack: () => void }) {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  const [font, setFont] = useState<"large" | "extra_large">("large");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setPhoneErr(null);
    if (mode === "signup") {
      if (!phone.trim()) { setPhoneErr("Phone number is required"); return; }
      if (!isValidPhone(phone)) { setPhoneErr("Please enter a valid 10-digit phone number"); return; }
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return;
      }
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: name } },
      });
      if (error) throw error;
      const uid = data.user?.id;
      if (!uid) throw new Error("Account created — please check your email to confirm, then sign in.");
      const { error: pErr } = await supabase.from("profiles").insert({
        id: uid, full_name: name, role: "senior", phone_number: phone, font_size: font,
      });
      if (pErr) throw pErr;
      const { data: prof } = await supabase.from("profiles").select("invite_code").eq("id", uid).maybeSingle();
      await refreshProfile();
      onCreated(prof?.invite_code || "—");
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card-soft space-y-4">
      <div className="flex gap-2">
        <button type="button" className={`btn-base flex-1 ${mode==="signup"?"btn-primary":"btn-outline"}`} onClick={() => setMode("signup")}>Create account</button>
        <button type="button" className={`btn-base flex-1 ${mode==="signin"?"btn-primary":"btn-outline"}`} onClick={() => setMode("signin")}>Sign in</button>
      </div>
      {mode === "signup" && (
        <FormRow label="Full name">
          <input className="input-large" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormRow>
      )}
      <FormRow label="Email address">
        <input className="input-large" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormRow>
      {mode === "signup" && (
        <FormRow label="Phone Number — so your guardian can reach you">
          <input
            className="input-large"
            type="tel"
            placeholder="(555) 555-5555"
            required
            value={phone}
            onChange={(e) => { setPhone(formatPhone(e.target.value)); setPhoneErr(null); }}
          />
          {phoneErr && <span className="block text-sm font-bold mt-1" style={{ color: "var(--color-danger)" }}>{phoneErr}</span>}
        </FormRow>
      )}
      <FormRow label="Password">
        <input className="input-large" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormRow>
      {mode === "signin" && <ForgotPassword email={email} />}
      {mode === "signup" && (
        <FormRow label="Text size">
          <div className="flex gap-2">
            <button type="button" className={`btn-base flex-1 ${font==="large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("large")}>Large</button>
            <button type="button" className={`btn-base flex-1 ${font==="extra_large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("extra_large")}>Extra Large</button>
          </div>
        </FormRow>
      )}
      {err && <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
      <button className="btn-base btn-primary w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "signup" ? "Create My Account" : "Sign In"}
      </button>
      <button type="button" className="text-sm underline w-full" onClick={onBack}>← Back</button>
    </form>
  );
}

function GuardianForm({ onLinked, onBack }: { onLinked: () => void; onBack: () => void }) {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  const [rel, setRel] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setPhoneErr(null);
    if (mode === "signup") {
      if (!phone.trim()) { setPhoneErr("Phone number is required"); return; }
      if (!isValidPhone(phone)) { setPhoneErr("Please enter a valid 10-digit phone number"); return; }
    }
    setBusy(true);
    try {
      let uid: string | undefined;
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        uid = data.user?.id;
      } else {
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirectUrl, data: { full_name: name } },
        });
        if (error) throw error;
        uid = data.user?.id;
        if (!uid) throw new Error("Check your email to confirm, then sign in.");
        const { error: pErr } = await supabase.from("profiles").insert({
          id: uid, full_name: name, role: "guardian", phone_number: phone,
        });
        if (pErr) throw pErr;
      }
      if (!uid) throw new Error("Sign in failed");
      const { error: linkErr } = await supabase.rpc("link_guardian_by_code", { _code: code, _label: rel });
      if (linkErr) throw linkErr;
      await refreshProfile();
      onLinked();
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card-soft space-y-4">
      <div className="flex gap-2">
        <button type="button" className={`btn-base flex-1 ${mode==="signup"?"btn-primary":"btn-outline"}`} onClick={() => setMode("signup")}>Create account</button>
        <button type="button" className={`btn-base flex-1 ${mode==="signin"?"btn-primary":"btn-outline"}`} onClick={() => setMode("signin")}>Sign in</button>
      </div>
      {mode === "signup" && (
        <FormRow label="Full name">
          <input className="input-large" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormRow>
      )}
      <FormRow label="Email address">
        <input className="input-large" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormRow>
      {mode === "signup" && (
        <FormRow label="Phone Number — so we can alert you by call or text">
          <input
            className="input-large"
            type="tel"
            placeholder="(555) 555-5555"
            required
            value={phone}
            onChange={(e) => { setPhone(formatPhone(e.target.value)); setPhoneErr(null); }}
          />
          {phoneErr && <span className="block text-sm font-bold mt-1" style={{ color: "var(--color-danger)" }}>{phoneErr}</span>}
        </FormRow>
      )}
      <FormRow label="Password">
        <input className="input-large" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormRow>
      {mode === "signin" && <ForgotPassword email={email} />}
      <FormRow label="Relationship to senior (e.g. Daughter, Son, Friend)">
        <input className="input-large" required value={rel} onChange={(e) => setRel(e.target.value)} />
      </FormRow>
      <FormRow label="Invite code" hint="Ask the person you want to protect for their invite code. They must create their account first.">
        <input className="input-large uppercase tracking-widest" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </FormRow>
      {err && <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>{err}</p>}
      <button className="btn-base btn-primary w-full" disabled={busy}>
        {busy ? "Connecting…" : "Connect and Protect"}
      </button>
      <button type="button" className="text-sm underline w-full" onClick={onBack}>← Back</button>
    </form>
  );
}

function InviteCodeView({ code, onContinue }: { code: string; onContinue: () => void }) {
  return (
    <div className="card-soft text-center space-y-4">
      <h2>You're protected! 🎉</h2>
      <p>Share this code with your family member so they can protect you:</p>
      <div className="text-5xl font-extrabold tracking-widest py-4 rounded-2xl"
        style={{ background: "var(--color-sky)", color: "var(--color-brown)" }}>
        {code}
      </div>
      <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
        Multiple family members can use this same code.
      </p>
      <button className="btn-base btn-primary w-full" onClick={onContinue}>Continue to my dashboard</button>
    </div>
  );
}

function LinkedView({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="card-soft text-center space-y-4">
      <h2>Connected! 💙</h2>
      <p>You're now protecting your loved one. You'll see their alerts in your dashboard.</p>
      <button className="btn-base btn-primary w-full" onClick={onContinue}>Go to dashboard</button>
    </div>
  );
}

function ForgotPassword({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    setMsg(null); setErr(null);
    if (!email.trim()) { setErr("Enter your email above first, then click Forgot password."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMsg("Check your email for a link to reset your password.");
    } catch (e: any) {
      setErr(e?.message || "Could not send reset email");
    } finally { setBusy(false); }
  };

  return (
    <div className="text-center">
      <button type="button" className="text-sm underline" onClick={send} disabled={busy}>
        {busy ? "Sending…" : "Forgot password?"}
      </button>
      {msg && <p className="text-sm mt-2" style={{ color: "var(--color-rose)" }}>{msg}</p>}
      {err && <p className="text-sm font-bold mt-2" style={{ color: "var(--color-danger)" }}>{err}</p>}
    </div>
  );
}
