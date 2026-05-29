import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_admin")({
  component: AdminGate,
});

function AdminGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.warn("[admin-route-debug] redirecting: no authenticated user");
      navigate({ to: "/" });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (cancelled) return;
      if (error || !data) {
        console.warn("[admin-route-debug] redirecting from /admin", {
          reason: error ? "is_admin rpc error" : "is_admin returned false",
          userId: user.id,
          userEmail: user.email ?? null,
          rpcResult: data ?? null,
          rpcError: error?.message ?? null,
        });
        navigate({ to: "/dashboard" });
        return;
      }
      setState("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  if (state !== "ok") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm opacity-70">
        Checking admin access…
      </div>
    );
  }
  return <Outlet />;
}
