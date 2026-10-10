CREATE TABLE public.admin_test_accounts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_test_accounts TO service_role;
ALTER TABLE public.admin_test_accounts ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_test_accounts(user_id) VALUES
 ('521823ca-2297-4378-bc43-f72ce21fc1c9'),('4b3a35f2-475f-459b-9304-470842deeed4'),
 ('6fd63f2a-6b5d-4d0d-a614-e056a8385b8c'),('7faca483-f787-4dc8-b365-432d9fe94607');

CREATE OR REPLACE FUNCTION public.admin_list_test_accounts()
RETURNS SETOF uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT user_id FROM public.admin_test_accounts;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_test_account(_user_id uuid, _is_test boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _is_test THEN
    INSERT INTO public.admin_test_accounts(user_id) VALUES (_user_id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.admin_test_accounts WHERE user_id = _user_id;
  END IF;
  INSERT INTO public.admin_audit_log(admin_email, action, path)
    SELECT u.email, CASE WHEN _is_test THEN 'mark_test_account' ELSE 'unmark_test_account' END, _user_id::text
    FROM auth.users u WHERE u.id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  WITH t AS (SELECT user_id FROM public.admin_test_accounts)
  SELECT jsonb_build_object(
    'total_seniors', (SELECT count(*) FROM profiles WHERE role='senior' AND id NOT IN (SELECT user_id FROM t)),
    'test_seniors', (SELECT count(*) FROM profiles WHERE role='senior' AND id IN (SELECT user_id FROM t)),
    'total_guardians', (SELECT count(*) FROM profiles WHERE role='guardian' AND id NOT IN (SELECT user_id FROM t)),
    'test_guardians', (SELECT count(*) FROM profiles WHERE role='guardian' AND id IN (SELECT user_id FROM t)),
    'total_links', (SELECT count(*) FROM guardian_relationships WHERE status='active' AND senior_id NOT IN (SELECT user_id FROM t) AND guardian_id NOT IN (SELECT user_id FROM t)),
    'test_links', (SELECT count(DISTINCT u) FROM (SELECT senior_id u FROM guardian_relationships WHERE status='active' AND (senior_id IN (SELECT user_id FROM t) OR guardian_id IN (SELECT user_id FROM t)) UNION SELECT guardian_id FROM guardian_relationships WHERE status='active' AND (senior_id IN (SELECT user_id FROM t) OR guardian_id IN (SELECT user_id FROM t))) x WHERE u IN (SELECT user_id FROM t)),
    'total_messages', (SELECT count(*) FROM scam_alerts WHERE senior_id NOT IN (SELECT user_id FROM t)),
    'test_messages', (SELECT count(DISTINCT senior_id) FROM scam_alerts WHERE senior_id IN (SELECT user_id FROM t)),
    'total_sos', (SELECT count(*) FROM sos_events WHERE senior_id NOT IN (SELECT user_id FROM t)),
    'test_sos', (SELECT count(DISTINCT senior_id) FROM sos_events WHERE senior_id IN (SELECT user_id FROM t)),
    'active_users_today', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '24 hours' AND id NOT IN (SELECT user_id FROM t)),
    'test_active', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '24 hours' AND id IN (SELECT user_id FROM t))
  ) INTO result;
  RETURN result;
END; $$;