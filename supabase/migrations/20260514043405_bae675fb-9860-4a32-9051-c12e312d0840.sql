REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.link_guardian_by_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_guardian_by_code(text, text) TO authenticated;