CREATE OR REPLACE FUNCTION public.admin_list_sponsor_requests_all()
RETURNS TABLE(id uuid, full_name text, has_trusted_person text, heard_about text, created_at timestamptz, is_test boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT r.id, p.full_name, r.has_trusted_person, r.heard_about, r.created_at,
         EXISTS (SELECT 1 FROM public.admin_test_accounts t WHERE t.user_id = r.senior_id)
  FROM public.sponsor_requests r JOIN public.profiles p ON p.id = r.senior_id
  ORDER BY r.created_at ASC;
END $$;
REVOKE ALL ON FUNCTION public.admin_list_sponsor_requests_all() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_sponsor_requests_all() TO authenticated;