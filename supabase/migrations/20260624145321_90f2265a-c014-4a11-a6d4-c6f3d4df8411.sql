-- 1) Tables: add explicit deny-all-but-admin SELECT policies; block writes via API
CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can view admin users"
  ON public.admin_users FOR SELECT TO authenticated
  USING (public.is_admin());

-- 2) Revoke anon execute on admin-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_log_view(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_sos() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_audit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_guardians() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_messages() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_seniors() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_stats() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_log_view(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_sos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_audit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_guardians() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_seniors() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO authenticated;