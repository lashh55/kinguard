ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS family_code_word_ciphertext text,
  ADD COLUMN IF NOT EXISTS family_code_word_iv text,
  ADD COLUMN IF NOT EXISTS family_code_word_tag text,
  ADD COLUMN IF NOT EXISTS family_code_word_first_letter text,
  ADD COLUMN IF NOT EXISTS family_code_word_set_at timestamptz;