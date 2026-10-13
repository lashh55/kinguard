import { pageHead } from "@/lib/pageHead";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminTable } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/sponsors")({ head: () => pageHead("Admin sponsor requests", "Review KinGuard sponsored plan requests."), component: SponsorsPage });

type Row = { id: string; full_name: string; lives_alone: string; has_trusted_person: string; heard_about: string; created_at: string };
const label = (v: string) => (v === "yes" ? "Yes" : v === "no" ? "No" : "Not sure");

function SponsorsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    logAdminView("/admin/sponsors");
    supabase.rpc("admin_list_sponsor_requests").then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  return (
    <AdminShell title={`Sponsor requests (${rows.length})`}>
      <p className="text-sm opacity-70 mb-3">Oldest first. Real accounts only — test accounts are excluded.</p>
      <AdminTable rows={rows} empty="No sponsor requests yet." columns={[
        { key: "name", label: "Name", render: (r) => r.full_name },
        { key: "alone", label: "Lives alone?", render: (r) => label(r.lives_alone) },
        { key: "trusted", label: "Someone trusted?", render: (r) => label(r.has_trusted_person) },
        { key: "heard", label: "Heard about KinGuard", render: (r) => r.heard_about },
        { key: "date", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]} />
    </AdminShell>
  );
}
