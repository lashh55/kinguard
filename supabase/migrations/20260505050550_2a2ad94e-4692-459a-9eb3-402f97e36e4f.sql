
ALTER FUNCTION public.gen_invite_code() SET search_path = public;
ALTER FUNCTION public.set_invite_code() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_guardian_of(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.link_guardian_by_code(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_guardian_of(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_guardian_by_code(TEXT, TEXT) TO authenticated;
