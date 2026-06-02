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
  .handler(async ({ data }): Promise<AnalysisResult> => {
    return analyzeScamServer(data.content, data.channel);
  });
