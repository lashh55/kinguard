import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type SosEvent = {
  id: string;
  senior_id: string;
  senior_first_name?: string | null;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by_name: string | null;
  claimed_by?: string | null;
  claimed_by_name?: string | null;
  claimed_at?: string | null;
  helper_names?: string[] | null;
  urgent?: boolean | null;
  unreached_by_name?: string | null;
  last_alerted_at?: string | null;
  request_count?: number;
  latest_requested_at?: string | null;
};
type SosDatabase = Database & { public: { Functions: { request_sos: { Args: Record<string, never>; Returns: SosEvent } } } };
const sosClient = supabase as unknown as SupabaseClient<SosDatabase>;
export const requestHelp = () => sosClient.rpc("request_sos");
export const SOS_COLS = "id,senior_id,senior_first_name,created_at,acknowledged_at,acknowledged_by_name,claimed_by,claimed_by_name,claimed_at,helper_names,urgent,unreached_by_name,last_alerted_at,request_count,latest_requested_at";
export const REALERT_MS = 10 * 60 * 1000;
export const sosOverdue = (e: SosEvent, now: number) =>
  !e.acknowledged_at && !e.claimed_by && now - new Date(e.last_alerted_at || e.created_at).getTime() >= REALERT_MS;
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function helpRequestText(e: SosEvent, name: string, es: boolean) {
  const count = e.request_count ?? 1;
  if (count > 1) return es
    ? `${name} pidió ayuda (${count} veces) — la primera a las ${fmtTime(e.created_at)}, la última a las ${fmtTime(e.latest_requested_at || e.created_at)}`
    : `${name} asked for help (${count} times) — first at ${fmtTime(e.created_at)}, latest at ${fmtTime(e.latest_requested_at || e.created_at)}`;
  return es ? `${name} pidió ayuda — por favor comuníquese con esta persona ahora.` : `${name} asked for help — please contact them now.`;
}