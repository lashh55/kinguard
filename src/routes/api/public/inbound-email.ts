import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { analyzeScamServer } from "@/lib/scam-analyzer.server";

// SendGrid Inbound Parse webhook.
// Configure SendGrid to POST parsed fields (NOT raw MIME) to this URL.
//
// Expected fields from SendGrid:
//   from     - "Jane Senior <jane@example.com>"
//   to       - the forwarding address (e.g. check@check.getkinguard.com)
//   subject  - email subject
//   text     - plain-text body (includes the forwarded message)
//   html     - HTML body (fallback)
//   envelope - JSON string: { "to":[...], "from":"..." }

export const Route = createFileRoute("/api/public/inbound-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const fromRaw = (form.get("from")?.toString() ?? "").trim();
          const subject = (form.get("subject")?.toString() ?? "").trim();
          const text = (form.get("text")?.toString() ?? "").trim();
          const html = (form.get("html")?.toString() ?? "").trim();
          const envelopeRaw = form.get("envelope")?.toString() ?? "";

          // Extract sender email — prefer envelope, fall back to "from" header
          let senderEmail = "";
          try {
            const env = envelopeRaw ? JSON.parse(envelopeRaw) : null;
            if (env?.from && typeof env.from === "string") senderEmail = env.from;
          } catch { /* ignore */ }
          if (!senderEmail) {
            const m = fromRaw.match(/<([^>]+)>/) ?? fromRaw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
            if (m) senderEmail = m[1] ?? m[0];
          }
          senderEmail = senderEmail.toLowerCase().trim();

          if (!senderEmail) {
            console.warn("[inbound-email] no sender email found", { fromRaw });
            return new Response("ok", { status: 200 });
          }

          // Resolve senior by email via auth.users
          const { data: userList, error: userErr } =
            await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
          if (userErr) {
            console.error("[inbound-email] listUsers failed", userErr);
            return new Response("ok", { status: 200 });
          }
          const matchedUser = userList?.users?.find(
            (u) => (u.email ?? "").toLowerCase() === senderEmail,
          );
          if (!matchedUser) {
            console.warn("[inbound-email] sender not registered", { senderEmail });
            return new Response("ok", { status: 200 });
          }

          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, role, full_name")
            .eq("id", matchedUser.id)
            .maybeSingle();

          if (!profile || profile.role !== "senior") {
            console.warn("[inbound-email] sender is not a senior", { senderEmail });
            return new Response("ok", { status: 200 });
          }

          // Build content for analysis
          const bodyContent = text || html.replace(/<[^>]+>/g, " ");
          const content = [
            subject ? `Subject: ${subject}` : "",
            bodyContent,
          ].filter(Boolean).join("\n\n").slice(0, 8000);

          if (!content.trim()) {
            console.warn("[inbound-email] empty body", { senderEmail });
            return new Response("ok", { status: 200 });
          }

          // Analyze
          const result = await analyzeScamServer(content, "email_forward");

          // Insert alert — realtime publishes to senior + linked guardians
          const { error: insErr } = await supabaseAdmin.from("scam_alerts").insert({
            senior_id: profile.id,
            channel: result.ssn_requested ? "ssn_request" : "email_forward",
            content_preview: content.slice(0, 200),
            scam_score: result.score,
            scam_type: result.type,
            scam_flags: result.flags,
            ai_recommendation: result.recommendation,
            ai_urgency: result.urgency,
            status: "flagged",
            guardian_notified: true,
          });
          if (insErr) {
            console.error("[inbound-email] insert failed", insErr);
            return new Response("error", { status: 500 });
          }

          return new Response("ok", { status: 200 });
        } catch (e: any) {
          console.error("[inbound-email] handler error", e?.message ?? e);
          // Return 200 to stop SendGrid retries on permanent errors
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
