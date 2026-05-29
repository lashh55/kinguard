import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function logAdminRedirect(reason: string, details: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  console.warn("[admin-route-debug] redirecting from /admin", { reason, ...details });
}

function readJwtEmailClaim(accessToken?: string) {
  if (!accessToken || typeof window === "undefined") return null;
  try {
    const payload = JSON.parse(window.atob(accessToken.split(".")[1] ?? ""));
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);
    const jwtEmail = readJwtEmailClaim(sessionData.session?.access_token);

    if (userError || !userData.user) {
      logAdminRedirect("no authenticated user", {
        userError: userError?.message ?? null,
        hasSession: Boolean(sessionData.session),
        jwtEmail,
      });
      throw redirect({ to: "/" });
    }

    const { data, error } = await supabase.rpc("is_admin");
    if (error || !data) {
      logAdminRedirect(error ? "is_admin rpc error" : "is_admin returned false", {
        userId: userData.user.id,
        userEmail: userData.user.email ?? null,
        jwtEmail,
        rpcResult: data ?? null,
        rpcError: error?.message ?? null,
      });
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
