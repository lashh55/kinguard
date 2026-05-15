ALTER TABLE public.guardian_relationships
  ADD COLUMN IF NOT EXISTS last_alert_view_at timestamptz;

DROP POLICY IF EXISTS "guardian update own link" ON public.guardian_relationships;
CREATE POLICY "guardian update own link"
  ON public.guardian_relationships
  FOR UPDATE
  USING (auth.uid() = guardian_id)
  WITH CHECK (auth.uid() = guardian_id);

CREATE OR REPLACE FUNCTION public.get_my_guardians()
RETURNS TABLE(
  link_id uuid,
  guardian_id uuid,
  full_name text,
  relationship_label text,
  phone_last4 text,
  linked_at timestamptz,
  last_alert_view_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gr.id,
         gr.guardian_id,
         p.full_name,
         gr.relationship_label,
         right(regexp_replace(coalesce(p.phone_number, ''), '\D', '', 'g'), 4),
         gr.created_at,
         gr.last_alert_view_at
  FROM public.guardian_relationships gr
  JOIN public.profiles p ON p.id = gr.guardian_id
  WHERE gr.senior_id = auth.uid() AND gr.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.get_my_guardians() TO authenticated;