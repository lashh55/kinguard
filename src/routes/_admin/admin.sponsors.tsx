import { pageHead } from "@/lib/pageHead";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminTable } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/sponsors")({ head: () => pageHead("Admin sponsor requests", "Review KinGuard sponsored plan requests."), component: SponsorsPage });

type Row = { id: string; full_name: string; has_trusted_person: string; heard_about: string; created_at: string; is_test: boolean };
const label = (v: string) => (v === "yes" ? "Yes" : v === "no" ? "No" : "Not sure");

function SponsorsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [showTest, setShowTest] = useState(false);
  useEffect(() => {
    logAdminView("/admin/sponsors");
    supabase.rpc("admin_list_sponsor_requests_all").then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  const realCount = rows.filter((r) => !r.is_test).length;
  const visible = showTest ? rows : rows.filter((r) => !r.is_test);
  return (
    <AdminShell title={`Sponsor requests (${realCount})`}>
      <label className="flex items-center gap-2 mb-3 text-sm font-bold cursor-pointer w-fit">
        <input type="checkbox" role="switch" aria-checked={showTest} checked={showTest} onChange={(e) => setShowTest(e.target.checked)} className="h-5 w-5" />
        Show test accounts
      </label>
      <p className="text-sm opacity-70 mb-3">Oldest first — handled first come, first served. The total counts real accounts only{showTest ? "; test requests are shown but not counted." : ", test accounts are excluded."}</p>
      <AdminTable rows={visible} empty="No sponsor requests yet." columns={[
        { key: "name", label: "Name", render: (r) => (<span>{r.full_name}{r.is_test && <span className="ml-2 rounded px-1.5 py-0.5 text-xs font-bold bg-destructive text-destructive-foreground">TEST</span>}</span>) },
        { key: "ref", label: "Reference", render: (r) => <code className="text-xs">{r.id.slice(0, 8).toUpperCase()}</code> },
        { key: "trusted", label: "Someone trusted?", render: (r) => label(r.has_trusted_person) },
        { key: "heard", label: "Heard about KinGuard", render: (r) => r.heard_about },
        { key: "date", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]} />
    </AdminShell>
  );
}
