ALTER TABLE public.sos_events ADD COLUMN IF NOT EXISTS request_count integer NOT NULL DEFAULT 1;
ALTER TABLE public.sos_events ADD COLUMN IF NOT EXISTS latest_requested_at timestamptz;
UPDATE public.sos_events SET latest_requested_at = created_at WHERE latest_requested_at IS NULL;
CREATE OR REPLACE FUNCTION public.request_sos() RETURNS public.sos_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _event public.sos_events;
BEGIN
 IF _uid IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.guardian_relationships WHERE senior_id=_uid AND status='active') THEN RAISE EXCEPTION 'Please add a guardian before asking for help.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_uid::text, 0));
 SELECT * INTO _event FROM public.sos_events WHERE senior_id=_uid AND acknowledged_at IS NULL ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
 IF _event.id IS NOT NULL THEN
  UPDATE public.sos_events SET request_count=request_count+1, latest_requested_at=now() WHERE id=_event.id RETURNING * INTO _event;
 ELSE
  INSERT INTO public.sos_events(senior_id,latest_requested_at) VALUES(_uid,now()) RETURNING * INTO _event;
 END IF;
 RETURN _event;
END; $$;
REVOKE ALL ON FUNCTION public.request_sos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_sos() TO authenticated;
CREATE OR REPLACE FUNCTION public.claim_sos(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _event public.sos_events; _me text;
BEGIN
 SELECT * INTO _event FROM public.sos_events WHERE id=_id AND acknowledged_at IS NULL FOR UPDATE;
 IF auth.uid() IS NULL OR _event.id IS NULL OR NOT public.is_guardian_of(_event.senior_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 SELECT split_part(full_name,' ',1) INTO _me FROM public.profiles WHERE id=auth.uid();
 IF _event.claimed_by IS NULL THEN
  UPDATE public.sos_events SET claimed_by=auth.uid(),claimed_by_name=_me,claimed_at=now(),urgent=false,unreached_by_name=NULL WHERE id=_id;
 ELSIF _event.claimed_by<>auth.uid() THEN
  UPDATE public.sos_events SET helper_names=array_append(helper_names,_me) WHERE id=_id AND NOT (_me=ANY(helper_names));
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.claim_sos(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_sos(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.resolve_sos(_id uuid,_ok boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _event public.sos_events; _me text;
BEGIN
 SELECT * INTO _event FROM public.sos_events WHERE id=_id AND acknowledged_at IS NULL FOR UPDATE;
 IF auth.uid() IS NULL OR _event.id IS NULL OR NOT public.is_guardian_of(_event.senior_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF _event.claimed_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the guardian contacting them can update this alert.'; END IF;
 SELECT split_part(full_name,' ',1) INTO _me FROM public.profiles WHERE id=auth.uid();
 IF _ok THEN
  UPDATE public.sos_events SET acknowledged_by=auth.uid(),acknowledged_by_name=_me,acknowledged_at=now() WHERE senior_id=_event.senior_id AND acknowledged_at IS NULL;
 ELSE
  UPDATE public.sos_events SET claimed_by=NULL,claimed_by_name=NULL,claimed_at=NULL,helper_names='{}',urgent=true,unreached_by_name=_me,last_alerted_at=now() WHERE id=_id;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.resolve_sos(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_sos(uuid,boolean) TO authenticated;