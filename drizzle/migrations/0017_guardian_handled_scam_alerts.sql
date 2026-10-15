ALTER TABLE public.scam_alerts ADD COLUMN handled_at timestamptz, ADD COLUMN handled_by uuid, ADD COLUMN handled_by_name text, ADD COLUMN handled_note text;
CREATE OR REPLACE FUNCTION public.protect_scam_handled_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF current_user IN ('authenticated','anon') AND (NEW.handled_at IS DISTINCT FROM OLD.handled_at OR NEW.handled_by IS DISTINCT FROM OLD.handled_by OR NEW.handled_by_name IS DISTINCT FROM OLD.handled_by_name OR NEW.handled_note IS DISTINCT FROM OLD.handled_note) THEN RAISE EXCEPTION 'Handled status must be changed through the guardian action'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_scam_handled_update BEFORE UPDATE ON public.scam_alerts FOR EACH ROW EXECUTE FUNCTION public.protect_scam_handled_fields();
CREATE OR REPLACE FUNCTION public.protect_scam_handled_insert() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF current_user IN ('authenticated','anon') AND (NEW.handled_at IS NOT NULL OR NEW.handled_by IS NOT NULL OR NEW.handled_by_name IS NOT NULL OR NEW.handled_note IS NOT NULL) THEN RAISE EXCEPTION 'Handled status must be changed through the guardian action'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_scam_handled_insert BEFORE INSERT ON public.scam_alerts FOR EACH ROW EXECUTE FUNCTION public.protect_scam_handled_insert();
CREATE OR REPLACE FUNCTION public.mark_scam_alert_handled(_alert_id uuid, _note text DEFAULT NULL) RETURNS public.scam_alerts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.scam_alerts; gname text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF char_length(_note) > 150 THEN RAISE EXCEPTION 'Note too long'; END IF;
 SELECT * INTO a FROM public.scam_alerts WHERE id = _alert_id FOR UPDATE;
 IF NOT FOUND OR NOT public.is_guardian_of(a.senior_id) THEN RAISE EXCEPTION 'Alert access denied'; END IF;
 PERFORM 1 FROM public.guardian_relationships WHERE senior_id = a.senior_id AND guardian_id = auth.uid() AND status = 'active' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Alert access denied'; END IF;
 IF a.handled_at IS NOT NULL THEN RETURN a; END IF;
 SELECT public.guardian_notice_display_name(full_name) INTO gname FROM public.profiles WHERE id = auth.uid();
 UPDATE public.scam_alerts SET handled_at = now(), handled_by = auth.uid(), handled_by_name = gname, handled_note = CASE WHEN btrim(COALESCE(_note,'')) = '' THEN NULL ELSE _note END, status = 'handled' WHERE id = _alert_id RETURNING * INTO a;
 RETURN a;
END $$;
REVOKE ALL ON FUNCTION public.mark_scam_alert_handled(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_scam_alert_handled(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.record_scam_alert_view(_alert_id uuid, _message text DEFAULT NULL, _reply_key text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; gname text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT senior_id INTO sid FROM public.scam_alerts WHERE id = _alert_id;
 IF sid IS NULL OR NOT public.is_guardian_of(sid) THEN RAISE EXCEPTION 'Alert access denied'; END IF;
 IF char_length(_message) > 150 OR (_reply_key IS NOT NULL AND _reply_key NOT IN ('looking','call','delete')) THEN RAISE EXCEPTION 'Invalid reply'; END IF;
 SELECT full_name INTO gname FROM public.profiles WHERE id = auth.uid();
 INSERT INTO public.scam_alert_receipts(alert_id,guardian_id,senior_id,guardian_name,message,reply_key)
 VALUES(_alert_id,auth.uid(),sid,gname,CASE WHEN btrim(COALESCE(_message,'')) = '' THEN NULL ELSE _message END,_reply_key)
 ON CONFLICT(alert_id,guardian_id) DO UPDATE SET
 message = CASE WHEN _message IS NOT NULL OR _reply_key IS NOT NULL THEN EXCLUDED.message ELSE scam_alert_receipts.message END,
 reply_key = CASE WHEN _message IS NOT NULL OR _reply_key IS NOT NULL THEN EXCLUDED.reply_key ELSE scam_alert_receipts.reply_key END;
END $$;
REVOKE ALL ON FUNCTION public.record_scam_alert_view(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_scam_alert_view(uuid,text,text) TO authenticated;