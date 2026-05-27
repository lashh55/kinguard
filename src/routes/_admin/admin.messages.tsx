import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell, AdminTable } from "@/components/AdminShell";
import { logAdminView } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin/messages")({ component: MessagesPage });

type Row = {
  id: string; senior_id: string; senior_name: string | null; channel: string;
  scam_type: string | null; scam_score: number; status: string;
  content_preview: string | null; created_at: string;
};

function MessagesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    logAdminView("/admin/messages");
    supabase.rpc("admin_list_messages").then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);
  return (
    <AdminShell title={`Messages checked (${rows.length})`}>
      <AdminTable rows={rows} columns={[
        { key: "when", label: "When", render: (r) => new Date(r.created_at).toLocaleString() },
        { key: "who", label: "Senior", render: (r) => r.senior_name ?? "—" },
        { key: "ch", label: "Channel", render: (r) => r.channel },
        { key: "type", label: "Scam type", render: (r) => r.scam_type ?? "—" },
        { key: "score", label: "Score", render: (r) => r.scam_score },
        { key: "preview", label: "Preview", render: (r) => <span className="line-clamp-2 max-w-md inline-block">{r.content_preview ?? ""}</span> },
      ]} />
    </AdminShell>
  );
}
