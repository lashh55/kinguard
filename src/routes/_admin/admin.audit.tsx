import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminTable } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/audit")({ component: AuditPage });

type Row = { id: string; admin_email: string; action: string; path: string | null; created_at: string };

function AuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    logAdminView("/admin/audit");
    supabase.rpc("admin_list_audit").then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  return (
    <AdminShell title={`Admin audit log (${rows.length})`}>
      <AdminTable rows={rows} columns={[
        { key: "when", label: "When", render: (r) => new Date(r.created_at).toLocaleString() },
        { key: "who", label: "Admin", render: (r) => r.admin_email },
        { key: "act", label: "Action", render: (r) => r.action },
        { key: "path", label: "Path", render: (r) => r.path ?? "—" },
      ]} />
    </AdminShell>
  );
}
