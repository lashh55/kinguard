DROP POLICY IF EXISTS "guardian can insert link" ON public.guardian_relationships;
REVOKE INSERT ON public.guardian_relationships FROM authenticated;
REVOKE INSERT ON public.guardian_relationships FROM anon;