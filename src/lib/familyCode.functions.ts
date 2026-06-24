import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function getKey() {
  const raw = process.env.FAMILY_CODE_ENCRYPTION_KEY;
  if (!raw) throw new Error("FAMILY_CODE_ENCRYPTION_KEY missing");
  // Derive a 32-byte key from the secret (any length) via SHA-256
  const { createHash } = require("crypto") as typeof import("crypto");
  return createHash("sha256").update(raw).digest();
}

export const setFamilyCodeWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ codeWord: z.string().trim().min(2).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { randomBytes, createCipheriv } = await import("crypto");
    const key = getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([cipher.update(data.codeWord, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const firstLetter = data.codeWord.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "•";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        family_code_word_ciphertext: enc.toString("base64"),
        family_code_word_iv: iv.toString("base64"),
        family_code_word_tag: tag.toString("base64"),
        family_code_word_first_letter: firstLetter,
        family_code_word_set_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, firstLetter };
  });

export const revealFamilyCodeWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Re-authenticate via password against the current user's email
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const email = (context.claims as any)?.email as string | undefined;
    if (!email) throw new Error("No email on session");
    const verifier = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { error: authErr } = await verifier.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (authErr) throw new Error("Incorrect password");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select("family_code_word_ciphertext, family_code_word_iv, family_code_word_tag")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.family_code_word_ciphertext || !row.family_code_word_iv || !row.family_code_word_tag) {
      throw new Error("No code word set");
    }
    const { createDecipheriv } = await import("crypto");
    const key = getKey();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(row.family_code_word_iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(row.family_code_word_tag, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(row.family_code_word_ciphertext, "base64")),
      decipher.final(),
    ]);
    return { codeWord: dec.toString("utf8") };
  });

export const clearFamilyCodeWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        family_code_word_ciphertext: null,
        family_code_word_iv: null,
        family_code_word_tag: null,
        family_code_word_first_letter: null,
        family_code_word_set_at: null,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
