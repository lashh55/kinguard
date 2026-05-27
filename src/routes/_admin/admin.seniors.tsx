import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminTable } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/seniors")({ component: SeniorsPage });

type Row = { id: string; full_name: string; invite_code: string | null; created_at: string; guardian_count: number };

function SeniorsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    logAdminView("/admin/seniors");
    supabase.rpc("admin_list_seniors").then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  return (
    <AdminShell title={`Seniors (${rows.length})`}>
      <AdminTable rows={rows} columns={[
        { key: "name", label: "Name", render: (r) => r.full_name },
        { key: "code", label: "Invite code", render: (r) => <span className="invite-code font-mono">{r.invite_code ?? "—"}</span> },
        { key: "guardians", label: "Guardians", render: (r) => r.guardian_count },
        { key: "created", label: "Joined", render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]} />
    </AdminShell>
  );
}
