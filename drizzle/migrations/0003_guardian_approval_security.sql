CREATE EXTENSION IF NOT EXISTS pg_cron;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code_created_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.invite_code_created_at := now();
    RETURN NEW;
  END IF;
  NEW.role := OLD.role;
  IF NEW.invite_code IS DISTINCT FROM OLD.invite_code THEN
    NEW.invite_code_created_at := now();
  ELSE
    NEW.invite_code_created_at := OLD.invite_code_created_at;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS profiles_protect_fields ON public.profiles;
CREATE TRIGGER profiles_protect_fields BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

CREATE TABLE public.guardian_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL,
  senior_id uuid NOT NULL,
  new_guardian_name text NOT NULL,
  senior_name text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.guardian_notices TO authenticated;
GRANT ALL ON public.guardian_notices TO service_role;
ALTER TABLE public.guardian_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guardian view own notices" ON public.guardian_notices FOR SELECT TO authenticated USING (auth.uid() = guardian_id);
CREATE POLICY "guardian mark own notices" ON public.guardian_notices FOR UPDATE TO authenticated USING (auth.uid() = guardian_id) WITH CHECK (auth.uid() = guardian_id);

CREATE OR REPLACE FUNCTION public.link_guardian_by_code(_code text, _label text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _senior uuid; _senior_name text; _created timestamptz; _count int; _mine int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id, full_name, invite_code_created_at INTO _senior, _senior_name, _created
    FROM public.profiles WHERE invite_code = upper(_code) AND role='senior';
  IF _senior IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  IF _created < now() - interval '24 hours' THEN
    RAISE EXCEPTION 'This invite code has expired. Ask % to create a new code on their Profile page.', split_part(_senior_name,' ',1);
  END IF;
  IF EXISTS (SELECT 1 FROM public.guardian_relationships WHERE senior_id=_senior AND guardian_id=auth.uid()) THEN
    RETURN _senior;
  END IF;
  SELECT count(*) INTO _mine FROM public.guardian_relationships WHERE guardian_id=auth.uid() AND status IN ('active','pending');
  IF _mine >= 3 THEN RAISE EXCEPTION 'You are already protecting the maximum of 3 loved ones.'; END IF;
  SELECT count(*) INTO _count FROM public.guardian_relationships WHERE senior_id=_senior AND status='active';
  IF _count >= 5 THEN
    RAISE EXCEPTION 'This account has reached the maximum of 5 guardians. Please ask % to remove a guardian before adding a new one.', _senior_name;
  END IF;
  INSERT INTO public.guardian_relationships(senior_id, guardian_id, relationship_label, status, invite_code)
    VALUES (_senior, auth.uid(), _label, 'pending', upper(_code));
  RETURN _senior;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_pending_guardian_requests()
 RETURNS TABLE(link_id uuid, full_name text, relationship_label text, created_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT gr.id, p.full_name, gr.relationship_label, gr.created_at
  FROM public.guardian_relationships gr JOIN public.profiles p ON p.id = gr.guardian_id
  WHERE gr.senior_id = auth.uid() AND gr.status = 'pending'
  ORDER BY gr.created_at;
$$;

CREATE OR REPLACE FUNCTION public.respond_guardian_request(_link_id uuid, _approve boolean)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _g uuid; _gname text; _sname text; _count int;
BEGIN
  SELECT guardian_id INTO _g FROM public.guardian_relationships
    WHERE id=_link_id AND senior_id=auth.uid() AND status='pending';
  IF _g IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT _approve THEN
    DELETE FROM public.guardian_relationships WHERE id=_link_id;
    RETURN;
  END IF;
  SELECT count(*) INTO _count FROM public.guardian_relationships WHERE senior_id=auth.uid() AND status='active';
  IF _count >= 5 THEN RAISE EXCEPTION 'You already have the maximum of 5 guardians. Remove one first.'; END IF;
  UPDATE public.guardian_relationships SET status='active' WHERE id=_link_id;
  SELECT split_part(full_name,' ',1) INTO _gname FROM public.profiles WHERE id=_g;
  SELECT split_part(full_name,' ',1) INTO _sname FROM public.profiles WHERE id=auth.uid();
  INSERT INTO public.guardian_notices(guardian_id, senior_id, new_guardian_name, senior_name)
    SELECT gr.guardian_id, auth.uid(), _gname, _sname FROM public.guardian_relationships gr
    WHERE gr.senior_id=auth.uid() AND gr.status='active' AND gr.guardian_id <> _g;
END; $$;

REVOKE EXECUTE ON FUNCTION public.get_pending_guardian_requests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.respond_guardian_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_guardian_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_guardian_request(uuid, boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.acknowledge_sos(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_sos(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_sos_senior_name() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_guardian_by_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_guardian_by_code(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.purge_old_email_content()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.scam_alerts SET content_preview = NULL, scam_flags = '[]'::jsonb, ai_recommendation = NULL
    WHERE channel = 'email_forward' AND created_at < now() - interval '30 days'
      AND (content_preview IS NOT NULL OR ai_recommendation IS NOT NULL OR scam_flags <> '[]'::jsonb);
  DELETE FROM public.inbound_email_logs WHERE created_at < now() - interval '30 days';
END; $$;
REVOKE EXECUTE ON FUNCTION public.purge_old_email_content() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('purge-old-email-content', '15 3 * * *', 'SELECT public.purge_old_email_content();');