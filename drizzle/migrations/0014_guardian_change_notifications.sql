ALTER TABLE public.guardian_notices ADD COLUMN notice_kind text NOT NULL DEFAULT 'added';
ALTER TABLE public.guardian_notices ADD CONSTRAINT guardian_notice_kind_check CHECK (notice_kind IN ('added','removed'));
CREATE OR REPLACE FUNCTION public.guardian_notice_display_name(_name text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
 SELECT CASE WHEN btrim(coalesce(_name,'')) ~ '\s' THEN regexp_replace(btrim(_name), '\s+\S+$', '') || ' ' || upper(left(regexp_replace(btrim(_name), '^.*\s+', ''),1)) || '.' ELSE btrim(coalesce(_name,'')) END;
$$;
REVOKE ALL ON FUNCTION public.guardian_notice_display_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardian_notice_display_name(text) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.notify_guardian_relationship_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; gid uuid; sname text; gname text;
BEGIN
 IF TG_OP = 'DELETE' THEN
  IF OLD.status <> 'active' THEN RETURN OLD; END IF;
  sid := OLD.senior_id; gid := OLD.guardian_id;
  SELECT public.guardian_notice_display_name(full_name) INTO sname FROM public.profiles WHERE id=sid;
  IF sname IS NOT NULL THEN
   INSERT INTO public.guardian_notices(guardian_id,senior_id,new_guardian_name,senior_name,notice_kind)
   SELECT gr.guardian_id,sid,'',sname,'removed' FROM public.guardian_relationships gr
   WHERE gr.senior_id=sid AND gr.status='active' AND gr.guardian_id<>gid;
  END IF;
  RETURN OLD;
 END IF;
 IF NEW.status <> 'active' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN IF OLD.status='active' THEN RETURN NEW; END IF; END IF;
 sid:=NEW.senior_id; gid:=NEW.guardian_id;
 SELECT public.guardian_notice_display_name(full_name) INTO sname FROM public.profiles WHERE id=sid;
 SELECT public.guardian_notice_display_name(full_name) INTO gname FROM public.profiles WHERE id=gid;
 INSERT INTO public.guardian_notices(guardian_id,senior_id,new_guardian_name,senior_name,notice_kind)
 VALUES(sid,sid,coalesce(gname,''),coalesce(sname,''),'added');
 INSERT INTO public.guardian_notices(guardian_id,senior_id,new_guardian_name,senior_name,notice_kind)
 SELECT gr.guardian_id,sid,coalesce(gname,''),coalesce(sname,''),'added' FROM public.guardian_relationships gr
 WHERE gr.senior_id=sid AND gr.status='active' AND gr.guardian_id<>gid;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_guardian_relationship_change() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guardian_relationship_change_notice AFTER INSERT OR UPDATE OF status OR DELETE ON public.guardian_relationships FOR EACH ROW EXECUTE FUNCTION public.notify_guardian_relationship_change();
CREATE OR REPLACE FUNCTION public.link_guardian_by_code(_code text, _label text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _senior uuid; _senior_name text; _created timestamptz; _count int; _mine int;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 SELECT id,full_name,invite_code_created_at INTO _senior,_senior_name,_created FROM public.profiles WHERE invite_code=upper(_code) AND role='senior';
 IF _senior IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
 IF _created < now()-interval '24 hours' THEN RAISE EXCEPTION 'This invite code has expired. Ask % to create a new code on their Profile page.',split_part(_senior_name,' ',1); END IF;
 IF EXISTS(SELECT 1 FROM public.guardian_relationships WHERE senior_id=_senior AND guardian_id=auth.uid()) THEN RETURN _senior; END IF;
 SELECT count(*) INTO _mine FROM public.guardian_relationships WHERE guardian_id=auth.uid() AND status IN ('active','pending');
 IF _mine>=2 THEN RAISE EXCEPTION 'KINGUARD_GUARDIAN_LIMIT'; END IF;
 SELECT count(*) INTO _count FROM public.guardian_relationships WHERE senior_id=_senior AND status='active';
 IF _count>=5 THEN RAISE EXCEPTION 'This account has reached the maximum of 5 guardians. Please ask % to remove a guardian before adding a new one.',_senior_name; END IF;
 INSERT INTO public.guardian_relationships(senior_id,guardian_id,relationship_label,status,invite_code) VALUES(_senior,auth.uid(),_label,'active',upper(_code));
 RETURN _senior;
END; $$;
REVOKE ALL ON FUNCTION public.link_guardian_by_code(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.link_guardian_by_code(text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.respond_guardian_request(_link_id uuid,_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _g uuid; _count int;
BEGIN
 SELECT guardian_id INTO _g FROM public.guardian_relationships WHERE id=_link_id AND senior_id=auth.uid() AND status='pending';
 IF _g IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
 IF NOT _approve THEN DELETE FROM public.guardian_relationships WHERE id=_link_id; RETURN; END IF;
 SELECT count(*) INTO _count FROM public.guardian_relationships WHERE senior_id=auth.uid() AND status='active';
 IF _count>=5 THEN RAISE EXCEPTION 'You already have the maximum of 5 guardians. Remove one first.'; END IF;
 UPDATE public.guardian_relationships SET status='active' WHERE id=_link_id;
END; $$;
REVOKE ALL ON FUNCTION public.respond_guardian_request(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.respond_guardian_request(uuid,boolean) TO authenticated;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='guardian_notices') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.guardian_notices; END IF; END $$;