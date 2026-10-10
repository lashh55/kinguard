import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeScamServer, type AnalysisResult } from "@/lib/scam-analyzer.server";

export const analyzeScam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { content: string; channel: string }) => {
    if (!d?.content || typeof d.content !== "string") throw new Error("content required");
    if (d.content.length > 8000) throw new Error("content too long");
    return { content: d.content.trim(), channel: d.channel || "manual" };
  })
  .handler(async ({ data, context }): Promise<AnalysisResult> => {
    const start = new Date(); start.setUTCHours(0, 0, 0, 0);
    const { count } = await context.supabase.from("scam_alerts").select("id", { count: "exact", head: true })
      .eq("senior_id", context.userId).gte("created_at", start.toISOString());
    if ((count ?? 0) >= 20) throw new Error("DAILY_LIMIT");
    return analyzeScamServer(data.content, data.channel);
  });