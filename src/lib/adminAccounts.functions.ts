import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Every handler verifies the caller is an admin (via their own session) before using the privileged client.
async function assertAdmin(context: { supabase: any; claims: any }) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error || !data) throw new Response("Forbidden", { status: 403 });
  return (context.claims?.email as string) ?? "admin";
}

async function audit(adminEmail: string, action: string, path: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({ admin_email: adminEmail, action, path });
}

async function isTest(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("admin_test_accounts").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

const idSchema = z.object({ userId: z.string().uuid() });

export const getAccountDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => idSchema.parse(i))
  .handler(async ({ data, context }) => {
    const adminEmail = await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: u, error }, { data: p }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(data.userId),
      supabaseAdmin.from("profiles").select("full_name, role, created_at").eq("id", data.userId).maybeSingle(),
    ]);
    if (error || !u?.user) throw new Error("Account not found");
    await audit(adminEmail, "view_account_detail", `/admin/accounts/${data.userId}`);
    return {
      id: data.userId,
      full_name: p?.full_name ?? "",
      role: p?.role ?? "unknown",
      email: u.user.email ?? "",
      created_at: p?.created_at ?? u.user.created_at,
      last_sign_in_at: u.user.last_sign_in_at ?? null,
      is_test: await isTest(data.userId),
    };
  });

export const sendAccountPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => idSchema.extend({ origin: z.string().url() }).parse(i))
  .handler(async ({ data, context }) => {
    const adminEmail = await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const email = u?.user?.email;
    if (!email) throw new Error("Account has no email");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(data.origin).origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
    await audit(adminEmail, "send_password_reset", `/admin/accounts/${data.userId}`);
    return { ok: true };
  });

export const changeTestAccountEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => idSchema.extend({ email: z.string().trim().email().max(255) }).parse(i))
  .handler(async ({ data, context }) => {
    const adminEmail = await assertAdmin(context);
    if (!(await isTest(data.userId))) throw new Error("Only test accounts can have their email changed.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: data.email, email_confirm: true });
    if (error) throw new Error(error.message);
    await audit(adminEmail, "change_test_account_email", `/admin/accounts/${data.userId}`);
    return { ok: true };
  });
