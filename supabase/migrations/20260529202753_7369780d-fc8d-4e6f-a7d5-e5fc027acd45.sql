CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.admin_users au
      ON lower(trim(au.email)) = lower(trim(u.email))
    WHERE u.id = auth.uid()
  );
$function$;