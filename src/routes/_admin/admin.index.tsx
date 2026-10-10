import { pageHead } from "@/lib/pageHead";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/")({ head: () => pageHead("Admin overview", "Review read-only KinGuard protection statistics and recent user activity."), component: AdminHome });

type Stats = Record<string, number>;

function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    logAdminView("/admin");
    supabase.rpc("admin_get_stats").then(({ data }) => setStats(data as Stats));
  }, []);
  const cards = [
    { label: "Seniors", value: stats?.total_seniors, test: stats?.test_seniors },
    { label: "Guardians", value: stats?.total_guardians, test: stats?.test_guardians },
    { label: "Active links", value: stats?.total_links, test: stats?.test_links },
    { label: "Messages checked", value: stats?.total_messages, test: stats?.test_messages },
    { label: "Help requests", value: stats?.total_sos, test: stats?.test_sos },
    { label: "Active users (24h)", value: stats?.active_users_today, test: stats?.test_active },
  ];
  return (
    <AdminShell title="Overview">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border p-4" style={{ background: "var(--color-cream)" }}>
            <div className="text-sm opacity-70">{c.label}</div>
            <div className="text-3xl font-bold mt-1">{c.value ?? "—"}</div>
            {stats && <div className="text-xs opacity-70 mt-1">Excludes {c.test ?? 0} test account{c.test === 1 ? "" : "s"}.</div>}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
