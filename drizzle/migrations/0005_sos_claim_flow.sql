ALTER TABLE public.sos_events
  ADD COLUMN IF NOT EXISTS claimed_by uuid,
  ADD COLUMN IF NOT EXISTS claimed_by_name text,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS helper_names text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unreached_by_name text,
  ADD COLUMN IF NOT EXISTS last_alerted_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_sos_senior_name()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  NEW.senior_first_name := (SELECT split_part(full_name,' ',1) FROM public.profiles WHERE id = NEW.senior_id);
  NEW.acknowledged_by := NULL; NEW.acknowledged_by_name := NULL; NEW.acknowledged_at := NULL;
  NEW.claimed_by := NULL; NEW.claimed_by_name := NULL; NEW.claimed_at := NULL;
  NEW.helper_names := '{}'; NEW.urgent := false; NEW.unreached_by_name := NULL;
  NEW.last_alerted_at := now();
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.claim_sos(_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _senior uuid; _me text; _claimer uuid;
BEGIN
  SELECT senior_id, claimed_by INTO _senior, _claimer FROM public.sos_events WHERE id = _id AND acknowledged_at IS NULL;
  IF _senior IS NULL OR NOT public.is_guardian_of(_senior) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT split_part(full_name,' ',1) INTO _me FROM public.profiles WHERE id = auth.uid();
  IF _claimer IS NULL THEN
    UPDATE public.sos_events SET claimed_by = auth.uid(), claimed_by_name = _me, claimed_at = now(),
      urgent = false, unreached_by_name = NULL
    WHERE id = _id AND claimed_by IS NULL;
  ELSIF _claimer <> auth.uid() THEN
    UPDATE public.sos_events SET helper_names = array_append(helper_names, _me)
    WHERE id = _id AND NOT (_me = ANY(helper_names));
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.resolve_sos(_id uuid, _ok boolean)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _senior uuid; _claimer uuid; _me text;
BEGIN
  SELECT senior_id, claimed_by INTO _senior, _claimer FROM public.sos_events WHERE id = _id AND acknowledged_at IS NULL;
  IF _senior IS NULL OR NOT public.is_guardian_of(_senior) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _claimer IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the guardian contacting them can update this alert.'; END IF;
  SELECT split_part(full_name,' ',1) INTO _me FROM public.profiles WHERE id = auth.uid();
  IF _ok THEN
    UPDATE public.sos_events SET acknowledged_by = auth.uid(), acknowledged_by_name = _me, acknowledged_at = now() WHERE id = _id;
  ELSE
    UPDATE public.sos_events SET claimed_by = NULL, claimed_by_name = NULL, claimed_at = NULL,
      helper_names = '{}', urgent = true, unreached_by_name = _me, last_alerted_at = now()
    WHERE id = _id;
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.claim_sos(uuid), public.resolve_sos(uuid, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_sos(uuid), public.resolve_sos(uuid, boolean) TO authenticated;