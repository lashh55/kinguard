CREATE OR REPLACE FUNCTION public.link_guardian_by_code(_code text, _label text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _senior uuid; _senior_name text; _gname text; _created timestamptz; _count int; _mine int;
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
    VALUES (_senior, auth.uid(), _label, 'active', upper(_code));
  SELECT split_part(full_name,' ',1) INTO _gname FROM public.profiles WHERE id=auth.uid();
  INSERT INTO public.guardian_notices(guardian_id, senior_id, new_guardian_name, senior_name)
    VALUES (_senior, _senior, _gname, split_part(_senior_name,' ',1));
  INSERT INTO public.guardian_notices(guardian_id, senior_id, new_guardian_name, senior_name)
    SELECT gr.guardian_id, _senior, _gname, split_part(_senior_name,' ',1)
    FROM public.guardian_relationships gr
    WHERE gr.senior_id=_senior AND gr.status='active' AND gr.guardian_id <> auth.uid();
  RETURN _senior;
END; $function$;