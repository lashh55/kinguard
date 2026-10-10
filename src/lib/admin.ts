import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export async function logAdminView(path: string) {
  await supabase.rpc("admin_log_view", { _path: path });
}

export function useTestAccounts() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    supabase.rpc("admin_list_test_accounts").then(({ data }) => setIds(new Set((data as string[]) ?? [])));
  }, []);
  const toggle = async (id: string, on: boolean) => {
    const { error } = await supabase.rpc("admin_set_test_account", { _user_id: id, _is_test: on });
    if (error) return;
    setIds((prev) => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; });
  };
  return { ids, toggle };
}
