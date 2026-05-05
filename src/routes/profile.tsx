import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { ScreenShell } from "@/components/ScreenShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  component: ProfileScreen,
});

function ProfileScreen() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate({ to: "/" }); }, [loading, user, navigate]);

  if (!profile) return null;

  const setFont = async (size: "large" | "extra_large") => {
    await supabase.from("profiles").update({ font_size: size }).eq("id", profile.id);
    await refreshProfile();
  };

  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3"><h1>👤 My Profile</h1></header>
      <section className="px-5 space-y-4">
        <div className="card-soft">
          <p><span className="font-bold">Name:</span> {profile.full_name}</p>
          <p className="mt-1"><span className="font-bold">Role:</span> {profile.role === "senior" ? "Protected Senior" : "Guardian"}</p>
          {profile.role === "senior" && profile.invite_code && (
            <div className="mt-3">
              <p className="font-bold mb-1">Your invite code:</p>
              <div className="text-3xl font-extrabold tracking-widest text-center py-3 rounded-xl"
                style={{ background: "var(--color-sky)" }}>{profile.invite_code}</div>
              <p className="text-sm mt-2" style={{ color: "var(--color-muted-foreground)" }}>
                Share this with the family member who will protect you.
              </p>
            </div>
          )}
        </div>

        <div className="card-soft">
          <p className="font-bold mb-2">Text size</p>
          <div className="flex gap-2">
            <button className={`btn-base flex-1 ${profile.font_size==="large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("large")}>Large</button>
            <button className={`btn-base flex-1 ${profile.font_size==="extra_large"?"btn-sky":"btn-outline"}`} onClick={() => setFont("extra_large")}>Extra Large</button>
          </div>
        </div>

        <button className="btn-base btn-outline w-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          Sign Out
        </button>
      </section>
    </ScreenShell>
  );
}
