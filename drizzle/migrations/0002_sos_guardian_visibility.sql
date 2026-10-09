ALTER TABLE public.sos_events
  ADD COLUMN IF NOT EXISTS acknowledged_by uuid,
  ADD COLUMN IF NOT EXISTS acknowledged_by_name text,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS senior_first_name text;

GRANT SELECT, INSERT ON public.sos_events TO authenticated;
GRANT ALL ON public.sos_events TO service_role;

CREATE POLICY "guardian view linked sos" ON public.sos_events
  FOR SELECT TO authenticated USING (public.is_guardian_of(senior_id));

CREATE OR REPLACE FUNCTION public.acknowledge_sos(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _senior uuid;
BEGIN
  SELECT senior_id INTO _senior FROM public.sos_events WHERE id = _id;
  IF _senior IS NULL OR NOT public.is_guardian_of(_senior) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.sos_events SET acknowledged_by = auth.uid(),
    acknowledged_by_name = (SELECT split_part(full_name,' ',1) FROM public.profiles WHERE id = auth.uid()),
    acknowledged_at = now()
  WHERE id = _id AND acknowledged_at IS NULL;
END; $$;
GRANT EXECUTE ON FUNCTION public.acknowledge_sos(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_sos_senior_name()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.senior_first_name := (SELECT split_part(full_name,' ',1) FROM public.profiles WHERE id = NEW.senior_id);
  NEW.acknowledged_by := NULL; NEW.acknowledged_by_name := NULL; NEW.acknowledged_at := NULL;
  RETURN NEW;
END; $$;
CREATE TRIGGER sos_events_set_name BEFORE INSERT ON public.sos_events
  FOR EACH ROW EXECUTE FUNCTION public.set_sos_senior_name();

ALTER TABLE public.sos_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_events;