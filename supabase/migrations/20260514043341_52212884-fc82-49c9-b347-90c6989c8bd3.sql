-- Enforce max 5 guardians per senior in link RPC + add delete account RPC
CREATE OR REPLACE FUNCTION public.link_guardian_by_code(_code text, _label text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _senior UUID;
  _senior_name TEXT;
  _count INT;
BEGIN
  SELECT id, full_name INTO _senior, _senior_name
    FROM public.profiles WHERE invite_code = upper(_code) AND role='senior';
  IF _senior IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;

  SELECT COUNT(*) INTO _count FROM public.guardian_relationships
    WHERE senior_id = _senior AND status = 'active';

  -- if this guardian is already linked, that's fine (no-op)
  IF EXISTS (SELECT 1 FROM public.guardian_relationships
             WHERE senior_id = _senior AND guardian_id = auth.uid()) THEN
    RETURN _senior;
  END IF;

  IF _count >= 5 THEN
    RAISE EXCEPTION 'This account has reached the maximum of 5 guardians. Please ask % to remove a guardian before adding a new one.', _senior_name;
  END IF;

  INSERT INTO public.guardian_relationships(senior_id, guardian_id, relationship_label, status, invite_code)
    VALUES (_senior, auth.uid(), _label, 'active', upper(_code));
  RETURN _senior;
END;
$function$;

-- Delete-account RPC: removes all user data for the calling user
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.scam_alerts WHERE senior_id = _uid;
  DELETE FROM public.quiz_attempts WHERE user_id = _uid;
  DELETE FROM public.guardian_relationships WHERE senior_id = _uid OR guardian_id = _uid;
  DELETE FROM public.profiles WHERE id = _uid;
  DELETE FROM auth.users WHERE id = _uid;
END;
$function$;