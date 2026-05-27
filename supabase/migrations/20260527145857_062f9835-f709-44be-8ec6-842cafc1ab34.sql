DROP FUNCTION IF EXISTS public.get_my_guardians();

CREATE OR REPLACE FUNCTION public.get_my_guardians()
RETURNS TABLE(
  link_id uuid,
  guardian_id uuid,
  full_name text,
  relationship_label text,
  linked_at timestamp with time zone,
  last_alert_view_at timestamp with time zone,
  total_alerts_reviewed bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT gr.id,
         gr.guardian_id,
         p.full_name,
         gr.relationship_label,
         gr.created_at,
         gr.last_alert_view_at,
         (SELECT count(*) FROM public.guardian_activity ga
            WHERE ga.guardian_id = gr.guardian_id
              AND ga.senior_id = gr.senior_id
              AND ga.action_type = 'alert_view')
  FROM public.guardian_relationships gr
  JOIN public.profiles p ON p.id = gr.guardian_id
  WHERE gr.senior_id = auth.uid() AND gr.status = 'active';
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_guardians() TO authenticated;