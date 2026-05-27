import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/" });
    const { data, error } = await supabase.rpc("is_admin");
    if (error || !data) throw redirect({ to: "/dashboard" });
  },
  component: () => <Outlet />,
});
