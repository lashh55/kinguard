## Goal
When a senior forwards a suspicious email to `check@check.getkinguard.com`, SendGrid Inbound Parse posts it to a KinGuard webhook. KinGuard identifies the senior by their forwarding address, runs the Claude scam analyzer, writes a `scam_alerts` row, and pushes the result in real time to the senior and every linked guardian.

## What I'll build

### 1. Public webhook route
`src/routes/api/public/inbound-email.ts` (under `/api/public/*` so external callers reach it without auth):
- Accepts `multipart/form-data` from SendGrid Inbound Parse
- Reads `from`, `subject`, `text`, `html`, `envelope`
- Resolves the senior:
  - Extract the **forwarding sender's** email (the senior's email, from the `from` field)
  - Use `supabaseAdmin` to look up `auth.users` by email → load matching `profiles` row (role = `senior`)
  - If no match, log + return 200 (silently drop so SendGrid doesn't retry forever)
- Calls existing Anthropic logic (refactored into a shared `analyzeScamServer(content)` helper in `src/lib/scam-analyzer.server.ts` so both the protected `analyzeScam` server fn and this webhook share one implementation; no behavior change for the in-app path)
- Inserts a `scam_alerts` row with the senior's id, channel `email_forward`, full result
- Returns 200 quickly

### 2. Realtime fan-out
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.scam_alerts;`
- Senior dashboard (`src/routes/dashboard.tsx`): subscribe to `scam_alerts` filtered to `senior_id=eq.<me>`; on insert, toast "📧 KinGuard analyzed your forwarded email — [verdict]" with a link to the alert
- Guardian view (`src/routes/for-guardians.tsx`): subscribe to `scam_alerts` and filter client-side using already-loaded linked-senior ids; on insert for any linked senior, toast the existing `notifyGuardianScam` message
- Existing RLS already lets seniors see their own rows and guardians see linked seniors' rows, so realtime payloads will be authorized per subscriber automatically

### 3. UI update
- `src/routes/check.tsx`: change `FORWARD_EMAIL` from `check@getkinguard.com` to `check@check.getkinguard.com`

### 4. DNS + SendGrid setup (manual steps for you)
After deploy, you'll need to:
1. **Add MX record** at your DNS provider for `check.getkinguard.com`:
   `MX 10 mx.sendgrid.net` (priority 10)
2. **In SendGrid → Settings → Inbound Parse**, add host `check.getkinguard.com` with destination URL:
   `https://warm-wise-safe.lovable.app/api/public/inbound-email` (or your custom domain equivalent)
   - Check ✅ "POST the raw, full MIME message" = OFF (we want parsed fields)
3. Test by forwarding an email from a senior's registered email address.

No SendGrid API key needed — Inbound Parse is webhook-only.

## Technical notes
- Senior must forward from the **same email address** they signed up with. If their email client rewrites the From header on forward, we fall back to scanning the email body for "Forwarded message" / "From:" lines and use that address.
- Webhook is public but harmless: it only inserts alerts scoped to existing senior accounts. Unknown senders are dropped.
- We add a lightweight HMAC-free spoofing guard: drop any request whose resolved sender isn't an existing senior in our DB. (SendGrid doesn't sign Inbound Parse; the senior-lookup gate is the security boundary.)
- Refactoring Anthropic call into `scam-analyzer.server.ts` keeps the existing `analyzeScam` server fn unchanged in behavior.

## Files
- new: `src/routes/api/public/inbound-email.ts`
- new: `src/lib/scam-analyzer.server.ts`
- edit: `src/server/scam.functions.ts` (delegate to shared helper)
- edit: `src/routes/check.tsx` (new address)
- edit: `src/routes/dashboard.tsx` (realtime senior toast)
- edit: `src/routes/for-guardians.tsx` (realtime guardian toast)
- migration: enable realtime on `scam_alerts`
