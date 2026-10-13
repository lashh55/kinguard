DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.sponsor_requests'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%lives_alone%'
  LOOP
    EXECUTE format('ALTER TABLE public.sponsor_requests DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE public.sponsor_requests
  ADD CONSTRAINT sponsor_requests_lives_alone_check
  CHECK (lives_alone IN ('yes','no','not_asked'));

ALTER TABLE public.sponsor_requests
  ALTER COLUMN lives_alone SET DEFAULT 'not_asked';

COMMENT ON COLUMN public.sponsor_requests.lives_alone IS
  'DEPRECATED: the living-situation question was removed from the sponsor request form; new rows store not_asked';