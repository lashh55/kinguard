-- Remove broad guardian access to senior profiles
DROP POLICY IF EXISTS "view linked senior profile" ON public.profiles;

-- Helper that returns only safe fields for guardians' linked seniors
CREATE OR REPLACE FUNCTION public.get_linked_seniors()
RETURNS TABLE(id uuid, first_name text, relationship_label text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         split_part(p.full_name, ' ', 1) AS first_name,
         gr.relationship_label
  FROM public.guardian_relationships gr
  JOIN public.profiles p ON p.id = gr.senior_id
  WHERE gr.guardian_id = auth.uid() AND gr.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.get_linked_seniors() TO authenticated;