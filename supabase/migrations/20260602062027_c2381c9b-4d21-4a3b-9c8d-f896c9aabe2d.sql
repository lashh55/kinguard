
CREATE TABLE public.inbound_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email TEXT,
  to_address TEXT,
  subject TEXT,
  body_preview TEXT,
  matched_senior_id UUID,
  status TEXT NOT NULL,
  message TEXT,
  raw_fields JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.inbound_email_logs TO authenticated;
GRANT ALL ON public.inbound_email_logs TO service_role;

ALTER TABLE public.inbound_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view inbound email logs"
ON public.inbound_email_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE INDEX idx_inbound_email_logs_created_at ON public.inbound_email_logs (created_at DESC);
