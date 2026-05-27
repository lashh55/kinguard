import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminTable } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/sos")({ component: SosPage });

type Row = { id: string; senior_id: string; senior_name: string | null; created_at: string };

function SosPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    logAdminView("/admin/sos");
    supabase.rpc("admin_list_sos").then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  return (
    <AdminShell title={`SOS events (${rows.length})`}>
      <AdminTable rows={rows} columns={[
        { key: "when", label: "When", render: (r) => new Date(r.created_at).toLocaleString() },
        { key: "who", label: "Senior", render: (r) => r.senior_name ?? "—" },
      ]} />
    </AdminShell>
  );
}
