import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/")({ component: AdminHome });

type Stats = {
  total_seniors: number; total_guardians: number; total_links: number;
  total_messages: number; total_sos: number; active_users_today: number;
};

function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    logAdminView("/admin");
    supabase.rpc("admin_get_stats").then(({ data }) => setStats(data as Stats));
  }, []);
  const cards = [
    { label: "Seniors", value: stats?.total_seniors },
    { label: "Guardians", value: stats?.total_guardians },
    { label: "Active links", value: stats?.total_links },
    { label: "Messages checked", value: stats?.total_messages },
    { label: "SOS events", value: stats?.total_sos },
    { label: "Active users (24h)", value: stats?.active_users_today },
  ];
  return (
    <AdminShell title="Overview">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border p-4" style={{ background: "var(--color-cream)" }}>
            <div className="text-sm opacity-70">{c.label}</div>
            <div className="text-3xl font-bold mt-1">{c.value ?? "—"}</div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
