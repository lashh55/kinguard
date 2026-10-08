CREATE OR REPLACE FUNCTION public.link_guardian_by_code(_code text, _label text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _senior UUID;
  _senior_name TEXT;
  _count INT;
  _mine INT;
BEGIN
  SELECT id, full_name INTO _senior, _senior_name
    FROM public.profiles WHERE invite_code = upper(_code) AND role='senior';
  IF _senior IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;

  IF EXISTS (SELECT 1 FROM public.guardian_relationships
             WHERE senior_id = _senior AND guardian_id = auth.uid()) THEN
    RETURN _senior;
  END IF;

  SELECT COUNT(*) INTO _mine FROM public.guardian_relationships
    WHERE guardian_id = auth.uid() AND status = 'active';
  IF _mine >= 3 THEN
    RAISE EXCEPTION 'You are already protecting the maximum of 3 loved ones.';
  END IF;

  SELECT COUNT(*) INTO _count FROM public.guardian_relationships
    WHERE senior_id = _senior AND status = 'active';
  IF _count >= 5 THEN
    RAISE EXCEPTION 'This account has reached the maximum of 5 guardians. Please ask % to remove a guardian before adding a new one.', _senior_name;
  END IF;

  INSERT INTO public.guardian_relationships(senior_id, guardian_id, relationship_label, status, invite_code)
    VALUES (_senior, auth.uid(), _label, 'active', upper(_code));
  RETURN _senior;
END;
$function$;