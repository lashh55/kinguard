
CREATE TABLE public.guardian_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL,
  senior_id uuid NOT NULL,
  alert_id uuid,
  action_type text NOT NULL CHECK (action_type IN ('app_open','alert_view','acknowledged','called_senior','blocked_sender')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_guardian_activity_senior ON public.guardian_activity(senior_id, created_at DESC);
CREATE INDEX idx_guardian_activity_guardian ON public.guardian_activity(guardian_id, created_at DESC);

ALTER TABLE public.guardian_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardian insert own activity"
  ON public.guardian_activity FOR INSERT
  WITH CHECK (auth.uid() = guardian_id AND public.is_guardian_of(senior_id));

CREATE POLICY "senior view activity for self"
  ON public.guardian_activity FOR SELECT
  USING (auth.uid() = senior_id);

CREATE POLICY "guardian view own activity"
  ON public.guardian_activity FOR SELECT
  USING (auth.uid() = guardian_id);

DROP FUNCTION IF EXISTS public.get_my_guardians();

CREATE OR REPLACE FUNCTION public.get_my_guardians()
RETURNS TABLE(
  link_id uuid,
  guardian_id uuid,
  full_name text,
  relationship_label text,
  phone_last4 text,
  linked_at timestamptz,
  last_alert_view_at timestamptz,
  total_alerts_reviewed bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT gr.id, gr.guardian_id, p.full_name, gr.relationship_label,
         right(regexp_replace(coalesce(p.phone_number, ''), '\D', '', 'g'), 4),
         gr.created_at, gr.last_alert_view_at,
         (SELECT count(*) FROM public.guardian_activity ga
            WHERE ga.guardian_id = gr.guardian_id
              AND ga.senior_id = gr.senior_id
              AND ga.action_type = 'alert_view')
  FROM public.guardian_relationships gr
  JOIN public.profiles p ON p.id = gr.guardian_id
  WHERE gr.senior_id = auth.uid() AND gr.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.get_guardian_activity_feed()
RETURNS TABLE(
  id uuid,
  guardian_id uuid,
  guardian_first_name text,
  alert_id uuid,
  alert_scam_type text,
  action_type text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT ga.id, ga.guardian_id, split_part(p.full_name, ' ', 1),
         ga.alert_id, sa.scam_type, ga.action_type, ga.created_at
  FROM public.guardian_activity ga
  JOIN public.profiles p ON p.id = ga.guardian_id
  LEFT JOIN public.scam_alerts sa ON sa.id = ga.alert_id
  WHERE ga.senior_id = auth.uid()
  ORDER BY ga.created_at DESC
  LIMIT 25;
$$;
