import { pageHead } from "@/lib/pageHead";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminTable } from "@/components/AdminShell";
import { logAdminView, useTestAccounts } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/guardians")({ head: () => pageHead("Admin guardians", "Review KinGuard guardian accounts and linked senior counts."), component: GuardiansPage });

type Row = { id: string; full_name: string; created_at: string; linked_seniors: number };

function GuardiansPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const test = useTestAccounts();
  useEffect(() => {
    logAdminView("/admin/guardians");
    supabase.rpc("admin_list_guardians").then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  return (
    <AdminShell title={`Guardians (${rows.length})`}>
      <AdminTable rows={rows} columns={[
        { key: "name", label: "Name", render: (r) => r.full_name },
        { key: "test", label: "Test account", render: (r) => <input type="checkbox" aria-label={`Test account: ${r.full_name}`} className="h-5 w-5" checked={test.ids.has(r.id)} onChange={(e) => test.toggle(r.id, e.target.checked)} /> },
        { key: "linked", label: "Linked seniors", render: (r) => r.linked_seniors },
        { key: "created", label: "Joined", render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]} />
    </AdminShell>
  );
}
