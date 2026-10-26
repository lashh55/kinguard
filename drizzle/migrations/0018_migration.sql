CREATE OR REPLACE FUNCTION public.request_money_check()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid := auth.uid(); sname text; n integer;
BEGIN
  IF sid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT public.guardian_notice_display_name(full_name) INTO sname FROM public.profiles WHERE id = sid AND role = 'senior';
  IF sname IS NULL THEN RAISE EXCEPTION 'not a senior'; END IF;
  INSERT INTO public.guardian_notices(guardian_id, senior_id, new_guardian_name, senior_name, notice_kind)
  SELECT gr.guardian_id, sid, '', sname, 'money_check' FROM public.guardian_relationships gr
  WHERE gr.senior_id = sid AND gr.status = 'active';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.request_money_check() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.request_money_check() TO authenticated;