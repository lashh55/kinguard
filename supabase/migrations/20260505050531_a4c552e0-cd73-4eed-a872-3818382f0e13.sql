
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('senior','guardian')),
  phone_number TEXT,
  font_size TEXT NOT NULL DEFAULT 'large' CHECK (font_size IN ('large','extra_large')),
  quiz_progress JSONB NOT NULL DEFAULT '{}',
  ssn_shield_progress JSONB NOT NULL DEFAULT '{}',
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- guardian_relationships
CREATE TABLE public.guardian_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active')),
  invite_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(senior_id, guardian_id)
);

-- scam_alerts
CREATE TABLE public.scam_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  content_preview TEXT,
  scam_score INTEGER NOT NULL DEFAULT 0,
  scam_type TEXT,
  scam_flags JSONB NOT NULL DEFAULT '[]',
  ai_recommendation TEXT,
  ai_urgency TEXT,
  status TEXT NOT NULL DEFAULT 'flagged',
  guardian_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scam_alerts ENABLE ROW LEVEL SECURITY;

-- Helper: is user a guardian of given senior?
CREATE OR REPLACE FUNCTION public.is_guardian_of(_senior UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guardian_relationships
    WHERE senior_id = _senior AND guardian_id = auth.uid() AND status = 'active'
  );
$$;

-- profiles policies
CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "view linked senior profile" ON public.profiles FOR SELECT USING (public.is_guardian_of(id));
CREATE POLICY "view by invite_code lookup disabled" ON public.profiles FOR SELECT USING (false);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- guardian_relationships policies
CREATE POLICY "senior or guardian can view" ON public.guardian_relationships FOR SELECT
  USING (auth.uid() = senior_id OR auth.uid() = guardian_id);
CREATE POLICY "guardian can insert link" ON public.guardian_relationships FOR INSERT
  WITH CHECK (auth.uid() = guardian_id);

-- scam_alerts policies
CREATE POLICY "senior view own alerts" ON public.scam_alerts FOR SELECT USING (auth.uid() = senior_id);
CREATE POLICY "guardian view linked alerts" ON public.scam_alerts FOR SELECT USING (public.is_guardian_of(senior_id));
CREATE POLICY "senior insert own alerts" ON public.scam_alerts FOR INSERT WITH CHECK (auth.uid() = senior_id);
CREATE POLICY "senior update own alerts" ON public.scam_alerts FOR UPDATE USING (auth.uid() = senior_id);

-- Auto-generate invite code for seniors
CREATE OR REPLACE FUNCTION public.gen_invite_code() RETURNS TEXT LANGUAGE SQL AS $$
  SELECT upper(substring(md5(random()::text||clock_timestamp()::text) from 1 for 6));
$$;

CREATE OR REPLACE FUNCTION public.set_invite_code() RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  IF NEW.role = 'senior' AND NEW.invite_code IS NULL THEN
    NEW.invite_code := public.gen_invite_code();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_invite_code BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_invite_code();

-- RPC for guardian to look up senior by invite code and create link
CREATE OR REPLACE FUNCTION public.link_guardian_by_code(_code TEXT, _label TEXT)
RETURNS UUID LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _senior UUID;
BEGIN
  SELECT id INTO _senior FROM public.profiles WHERE invite_code = upper(_code) AND role='senior';
  IF _senior IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  INSERT INTO public.guardian_relationships(senior_id, guardian_id, relationship_label, status, invite_code)
    VALUES (_senior, auth.uid(), _label, 'active', upper(_code))
    ON CONFLICT (senior_id, guardian_id) DO NOTHING;
  RETURN _senior;
END;
$$;
