
-- Admin allowlist
CREATE TABLE public.admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- no policies: only service_role and SECURITY DEFINER functions can read

INSERT INTO public.admin_users(email) VALUES ('admin@getkinguard.com') ON CONFLICT DO NOTHING;

-- is_admin helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- SOS events
CREATE TABLE public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sos_events TO authenticated;
GRANT ALL ON public.sos_events TO service_role;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "senior insert own sos" ON public.sos_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = senior_id);
CREATE POLICY "senior view own sos" ON public.sos_events
  FOR SELECT TO authenticated USING (auth.uid() = senior_id);

-- Admin audit log
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
-- no policies; read via RPC

-- RPC: stats
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT jsonb_build_object(
    'total_seniors', (SELECT count(*) FROM public.profiles WHERE role='senior'),
    'total_guardians', (SELECT count(*) FROM public.profiles WHERE role='guardian'),
    'total_links', (SELECT count(*) FROM public.guardian_relationships WHERE status='active'),
    'total_messages', (SELECT count(*) FROM public.scam_alerts),
    'total_sos', (SELECT count(*) FROM public.sos_events),
    'active_users_today', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '24 hours')
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO authenticated;

-- RPC: list seniors
CREATE OR REPLACE FUNCTION public.admin_list_seniors()
RETURNS TABLE(id UUID, full_name TEXT, invite_code TEXT, created_at TIMESTAMPTZ, guardian_count BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.invite_code, p.created_at,
      (SELECT count(*) FROM public.guardian_relationships gr WHERE gr.senior_id = p.id AND gr.status='active')
    FROM public.profiles p WHERE p.role='senior' ORDER BY p.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_seniors() TO authenticated;

-- RPC: list guardians
CREATE OR REPLACE FUNCTION public.admin_list_guardians()
RETURNS TABLE(id UUID, full_name TEXT, created_at TIMESTAMPTZ, linked_seniors BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.created_at,
      (SELECT count(*) FROM public.guardian_relationships gr WHERE gr.guardian_id = p.id AND gr.status='active')
    FROM public.profiles p WHERE p.role='guardian' ORDER BY p.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_guardians() TO authenticated;

-- RPC: list messages
CREATE OR REPLACE FUNCTION public.admin_list_messages()
RETURNS TABLE(id UUID, senior_id UUID, senior_name TEXT, channel TEXT, scam_type TEXT, scam_score INT, status TEXT, content_preview TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT sa.id, sa.senior_id, p.full_name, sa.channel, sa.scam_type, sa.scam_score, sa.status, sa.content_preview, sa.created_at
    FROM public.scam_alerts sa
    LEFT JOIN public.profiles p ON p.id = sa.senior_id
    ORDER BY sa.created_at DESC LIMIT 500;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_messages() TO authenticated;

-- RPC: list sos
CREATE OR REPLACE FUNCTION public.admin_list_sos()
RETURNS TABLE(id UUID, senior_id UUID, senior_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT s.id, s.senior_id, p.full_name, s.created_at
    FROM public.sos_events s
    LEFT JOIN public.profiles p ON p.id = s.senior_id
    ORDER BY s.created_at DESC LIMIT 500;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_sos() TO authenticated;

-- RPC: list audit
CREATE OR REPLACE FUNCTION public.admin_list_audit()
RETURNS TABLE(id UUID, admin_email TEXT, action TEXT, path TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT a.id, a.admin_email, a.action, a.path, a.created_at
    FROM public.admin_audit_log a ORDER BY a.created_at DESC LIMIT 500;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_audit() TO authenticated;

-- RPC: log a view
CREATE OR REPLACE FUNCTION public.admin_log_view(_path TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO public.admin_audit_log(admin_email, action, path)
    VALUES (coalesce(auth.jwt() ->> 'email', 'unknown'), 'view', _path);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_log_view(TEXT) TO authenticated;
