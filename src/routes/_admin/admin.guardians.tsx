import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminTable } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/guardians")({ component: GuardiansPage });

type Row = { id: string; full_name: string; created_at: string; linked_seniors: number };

function GuardiansPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    logAdminView("/admin/guardians");
    supabase.rpc("admin_list_guardians").then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  return (
    <AdminShell title={`Guardians (${rows.length})`}>
      <AdminTable rows={rows} columns={[
        { key: "name", label: "Name", render: (r) => r.full_name },
        { key: "linked", label: "Linked seniors", render: (r) => r.linked_seniors },
        { key: "created", label: "Joined", render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]} />
    </AdminShell>
  );
}
