ALTER TABLE public.scam_alerts ADD COLUMN senior_viewed_at timestamptz;
CREATE TABLE public.scam_alert_receipts (
 alert_id uuid NOT NULL REFERENCES public.scam_alerts(id) ON DELETE CASCADE,
 guardian_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 senior_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 guardian_name text NOT NULL,
 viewed_at timestamptz NOT NULL DEFAULT now(),
 message text CHECK (char_length(message) <= 150),
 reply_key text CHECK (reply_key IN ('looking','call','delete')),
 PRIMARY KEY(alert_id, guardian_id)
);
GRANT SELECT ON public.scam_alert_receipts TO authenticated;
GRANT ALL ON public.scam_alert_receipts TO service_role;
ALTER TABLE public.scam_alert_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "senior reads own scam receipts" ON public.scam_alert_receipts FOR SELECT TO authenticated USING (auth.uid() = senior_id);
CREATE POLICY "guardian reads own active scam receipts" ON public.scam_alert_receipts FOR SELECT TO authenticated USING (auth.uid() = guardian_id AND public.is_guardian_of(senior_id));
CREATE INDEX scam_alert_receipts_senior_idx ON public.scam_alert_receipts(senior_id);
CREATE OR REPLACE FUNCTION public.record_scam_alert_view(_alert_id uuid, _message text DEFAULT NULL, _reply_key text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; gname text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT senior_id INTO sid FROM public.scam_alerts WHERE id = _alert_id;
 IF sid IS NULL OR NOT public.is_guardian_of(sid) THEN RAISE EXCEPTION 'Alert access denied'; END IF;
 IF char_length(_message) > 150 OR (_reply_key IS NOT NULL AND _reply_key NOT IN ('looking','call','delete')) THEN RAISE EXCEPTION 'Invalid reply'; END IF;
 SELECT full_name INTO gname FROM public.profiles WHERE id = auth.uid();
 INSERT INTO public.scam_alert_receipts(alert_id,guardian_id,senior_id,guardian_name,message,reply_key)
 VALUES(_alert_id,auth.uid(),sid,gname,NULLIF(btrim(_message),''),_reply_key)
 ON CONFLICT(alert_id,guardian_id) DO UPDATE SET
 message = CASE WHEN _message IS NOT NULL OR _reply_key IS NOT NULL THEN EXCLUDED.message ELSE scam_alert_receipts.message END,
 reply_key = CASE WHEN _message IS NOT NULL OR _reply_key IS NOT NULL THEN EXCLUDED.reply_key ELSE scam_alert_receipts.reply_key END;
END $$;
REVOKE ALL ON FUNCTION public.record_scam_alert_view(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_scam_alert_view(uuid,text,text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scam_alert_receipts;