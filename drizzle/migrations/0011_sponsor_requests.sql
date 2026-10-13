CREATE TABLE public.sponsor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  lives_alone text NOT NULL CHECK (lives_alone IN ('yes','no')),
  has_trusted_person text NOT NULL CHECK (has_trusted_person IN ('yes','no','not_sure')),
  heard_about text NOT NULL CHECK (char_length(heard_about) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sponsor_requests TO authenticated;
GRANT ALL ON public.sponsor_requests TO service_role;
ALTER TABLE public.sponsor_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "senior insert own sponsor request" ON public.sponsor_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = senior_id);
CREATE POLICY "senior view own sponsor request" ON public.sponsor_requests FOR SELECT TO authenticated USING (auth.uid() = senior_id);

CREATE OR REPLACE FUNCTION public.admin_list_sponsor_requests()
RETURNS TABLE(id uuid, full_name text, lives_alone text, has_trusted_person text, heard_about text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT r.id, p.full_name, r.lives_alone, r.has_trusted_person, r.heard_about, r.created_at
    FROM public.sponsor_requests r
    JOIN public.profiles p ON p.id = r.senior_id
    WHERE NOT EXISTS (SELECT 1 FROM public.admin_test_accounts t WHERE t.user_id = r.senior_id)
    ORDER BY r.created_at ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_sponsor_requests() TO authenticated;