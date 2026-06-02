import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { analyzeScamServer } from "@/lib/scam-analyzer.server";

// SendGrid Inbound Parse webhook.
// Every request is recorded in public.inbound_email_logs for debugging.

type LogRow = {
  sender_email?: string | null;
  to_address?: string | null;
  subject?: string | null;
  body_preview?: string | null;
  matched_senior_id?: string | null;
  status: string;
  message?: string | null;
  raw_fields?: Record<string, unknown> | null;
};

async function writeLog(row: LogRow) {
  try {
    await supabaseAdmin.from("inbound_email_logs").insert(row);
  } catch (e) {
    console.error("[inbound-email] failed to write log", e);
  }
}

export const Route = createFileRoute("/api/public/inbound-email")({
  server: {
    handlers: {
      GET: async () => {
        // Helpful for verifying the URL is reachable from a browser.
        return new Response("inbound-email webhook is live", { status: 200 });
      },
      POST: async ({ request }) => {
        const rawFields: Record<string, unknown> = {};
        let senderEmail = "";
        let toAddress = "";
        let subject = "";
        let bodyPreview = "";

        try {
          const contentType = request.headers.get("content-type") ?? "";
          let form: FormData | null = null;

          if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
            form = await request.formData();
          } else {
            // Unknown content type — log raw body for debugging
            const body = await request.text();
            await writeLog({
              status: "unknown_content_type",
              message: `Content-Type: ${contentType}`,
              raw_fields: { body: body.slice(0, 2000) },
            });
            return new Response("ok", { status: 200 });
          }

          // Capture all fields for debugging
          for (const [key, value] of form.entries()) {
            if (typeof value === "string") {
              rawFields[key] = value.length > 2000 ? value.slice(0, 2000) + "…[truncated]" : value;
            } else {
              rawFields[key] = `[file:${(value as File).name ?? "unknown"}]`;
            }
          }

          const fromRaw = (form.get("from")?.toString() ?? "").trim();
          toAddress = (form.get("to")?.toString() ?? "").trim();
          subject = (form.get("subject")?.toString() ?? "").trim();
          const text = (form.get("text")?.toString() ?? "").trim();
          const html = (form.get("html")?.toString() ?? "").trim();
          const envelopeRaw = form.get("envelope")?.toString() ?? "";

          // Extract sender email
          try {
            const env = envelopeRaw ? JSON.parse(envelopeRaw) : null;
            if (env?.from && typeof env.from === "string") senderEmail = env.from;
          } catch { /* ignore */ }
          if (!senderEmail) {
            const m = fromRaw.match(/<([^>]+)>/) ?? fromRaw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
            if (m) senderEmail = m[1] ?? m[0];
          }
          senderEmail = senderEmail.toLowerCase().trim();

          const bodyContent = text || html.replace(/<[^>]+>/g, " ");
          bodyPreview = bodyContent.slice(0, 500);

          if (!senderEmail) {
            await writeLog({
              status: "no_sender",
              message: `Could not extract sender from "from" header: ${fromRaw}`,
              to_address: toAddress,
              subject,
              body_preview: bodyPreview,
              raw_fields: rawFields,
            });
            return new Response("ok", { status: 200 });
          }

          // Resolve senior by email
          const { data: userList, error: userErr } =
            await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
          if (userErr) {
            await writeLog({
              status: "user_lookup_failed",
              message: userErr.message,
              sender_email: senderEmail,
              to_address: toAddress,
              subject,
              body_preview: bodyPreview,
              raw_fields: rawFields,
            });
            return new Response("ok", { status: 200 });
          }
          const matchedUser = userList?.users?.find(
            (u) => (u.email ?? "").toLowerCase() === senderEmail,
          );
          if (!matchedUser) {
            await writeLog({
              status: "sender_not_registered",
              message: `No account found for ${senderEmail}`,
              sender_email: senderEmail,
              to_address: toAddress,
              subject,
              body_preview: bodyPreview,
              raw_fields: rawFields,
            });
            return new Response("ok", { status: 200 });
          }

          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, role, full_name")
            .eq("id", matchedUser.id)
            .maybeSingle();

          if (!profile || profile.role !== "senior") {
            await writeLog({
              status: "not_a_senior",
              message: `Profile role: ${profile?.role ?? "missing"}`,
              sender_email: senderEmail,
              to_address: toAddress,
              subject,
              body_preview: bodyPreview,
              matched_senior_id: matchedUser.id,
              raw_fields: rawFields,
            });
            return new Response("ok", { status: 200 });
          }

          const content = [
            subject ? `Subject: ${subject}` : "",
            bodyContent,
          ].filter(Boolean).join("\n\n").slice(0, 8000);

          if (!content.trim()) {
            await writeLog({
              status: "empty_body",
              sender_email: senderEmail,
              to_address: toAddress,
              subject,
              matched_senior_id: profile.id,
              raw_fields: rawFields,
            });
            return new Response("ok", { status: 200 });
          }

          const result = await analyzeScamServer(content, "email_forward");

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
            await writeLog({
              status: "insert_failed",
              message: insErr.message,
              sender_email: senderEmail,
              to_address: toAddress,
              subject,
              body_preview: bodyPreview,
              matched_senior_id: profile.id,
              raw_fields: rawFields,
            });
            return new Response("error", { status: 500 });
          }

          await writeLog({
            status: "success",
            message: `Alert created: ${result.type} (${result.score}/100)`,
            sender_email: senderEmail,
            to_address: toAddress,
            subject,
            body_preview: bodyPreview,
            matched_senior_id: profile.id,
            raw_fields: rawFields,
          });

          return new Response("ok", { status: 200 });
        } catch (e: any) {
          await writeLog({
            status: "handler_error",
            message: e?.message ?? String(e),
            sender_email: senderEmail || null,
            to_address: toAddress || null,
            subject: subject || null,
            body_preview: bodyPreview || null,
            raw_fields: rawFields,
          });
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
