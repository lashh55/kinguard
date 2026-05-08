ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS challenge_stats jsonb NOT NULL DEFAULT '{
  "total_correct": 0,
  "total_attempted": 0,
  "current_streak_weeks": 0,
  "best_streak_weeks": 0,
  "badges_earned": [],
  "current_badge": null,
  "last_answered_date": null,
  "last_streak_week": null,
  "perfect_week_groups": []
}'::jsonb;