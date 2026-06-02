ALTER PUBLICATION supabase_realtime ADD TABLE public.scam_alerts;
ALTER TABLE public.scam_alerts REPLICA IDENTITY FULL;