REVOKE EXECUTE ON FUNCTION public.get_my_guardians() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_guardians() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_guardians() TO authenticated;