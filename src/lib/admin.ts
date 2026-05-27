import { supabase } from "@/integrations/supabase/client";

export async function logAdminView(path: string) {
  await supabase.rpc("admin_log_view", { _path: path });
}
