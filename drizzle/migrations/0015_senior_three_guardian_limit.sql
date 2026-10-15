CREATE OR REPLACE FUNCTION public.enforce_senior_guardian_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _count integer;
BEGIN
 IF NEW.status <> 'active' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.status='active' AND OLD.senior_id=NEW.senior_id THEN RETURN NEW; END IF;
 END IF;
 PERFORM id FROM public.profiles WHERE id=NEW.senior_id FOR UPDATE;
 SELECT count(*) INTO _count FROM public.guardian_relationships WHERE senior_id=NEW.senior_id AND status='active' AND id<>NEW.id;
 IF _count>=3 THEN RAISE EXCEPTION 'KINGUARD_SENIOR_GUARDIAN_LIMIT'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.enforce_senior_guardian_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER senior_guardian_limit BEFORE INSERT OR UPDATE OF status, senior_id ON public.guardian_relationships FOR EACH ROW EXECUTE FUNCTION public.enforce_senior_guardian_limit();
CREATE OR REPLACE FUNCTION public.link_guardian_by_code(_code text, _label text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _senior uuid; _senior_name text; _created timestamptz; _count int; _mine int;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 SELECT id,full_name,invite_code_created_at INTO _senior,_senior_name,_created FROM public.profiles WHERE invite_code=upper(_code) AND role='senior' FOR UPDATE;
 IF _senior IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
 IF _created < now()-interval '24 hours' THEN RAISE EXCEPTION 'This invite code has expired. Ask % to create a new code on their Profile page.',split_part(_senior_name,' ',1); END IF;
 IF EXISTS(SELECT 1 FROM public.guardian_relationships WHERE senior_id=_senior AND guardian_id=auth.uid()) THEN RETURN _senior; END IF;
 SELECT count(*) INTO _mine FROM public.guardian_relationships WHERE guardian_id=auth.uid() AND status IN ('active','pending');
 IF _mine>=2 THEN RAISE EXCEPTION 'KINGUARD_GUARDIAN_LIMIT'; END IF;
 SELECT count(*) INTO _count FROM public.guardian_relationships WHERE senior_id=_senior AND status='active';
 IF _count>=3 THEN RAISE EXCEPTION 'KINGUARD_SENIOR_GUARDIAN_LIMIT'; END IF;
 INSERT INTO public.guardian_relationships(senior_id,guardian_id,relationship_label,status,invite_code) VALUES(_senior,auth.uid(),_label,'active',upper(_code));
 RETURN _senior;
END; $$;
REVOKE ALL ON FUNCTION public.link_guardian_by_code(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_guardian_by_code(text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.respond_guardian_request(_link_id uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _g uuid; _count int;
BEGIN
 SELECT guardian_id INTO _g FROM public.guardian_relationships WHERE id=_link_id AND senior_id=auth.uid() AND status='pending';
 IF _g IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
 IF NOT _approve THEN DELETE FROM public.guardian_relationships WHERE id=_link_id; RETURN; END IF;
 PERFORM id FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 SELECT count(*) INTO _count FROM public.guardian_relationships WHERE senior_id=auth.uid() AND status='active';
 IF _count>=3 THEN RAISE EXCEPTION 'KINGUARD_SENIOR_GUARDIAN_LIMIT'; END IF;
 UPDATE public.guardian_relationships SET status='active' WHERE id=_link_id;
END; $$;
REVOKE ALL ON FUNCTION public.respond_guardian_request(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_guardian_request(uuid,boolean) TO authenticated;