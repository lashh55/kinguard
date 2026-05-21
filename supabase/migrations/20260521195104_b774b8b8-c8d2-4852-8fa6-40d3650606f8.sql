DROP POLICY IF EXISTS "guardian update own link" ON public.guardian_relationships;

CREATE POLICY "guardian update own link cosmetic"
ON public.guardian_relationships
FOR UPDATE
USING (auth.uid() = guardian_id)
WITH CHECK (
  auth.uid() = guardian_id
  AND senior_id = (SELECT gr.senior_id FROM public.guardian_relationships gr WHERE gr.id = guardian_relationships.id)
  AND guardian_id = (SELECT gr.guardian_id FROM public.guardian_relationships gr WHERE gr.id = guardian_relationships.id)
  AND status = (SELECT gr.status FROM public.guardian_relationships gr WHERE gr.id = guardian_relationships.id)
  AND invite_code IS NOT DISTINCT FROM (SELECT gr.invite_code FROM public.guardian_relationships gr WHERE gr.id = guardian_relationships.id)
);