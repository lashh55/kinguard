export type ChallengeStats = {
  total_correct: number;
  total_attempted: number;
  current_streak_weeks: number;
  best_streak_weeks: number;
  badges_earned: string[];
  current_badge: string | null;
  last_answered_date: string | null;
  last_streak_week: number | null;
  perfect_week_groups?: number[];
};

export const DEFAULT_STATS: ChallengeStats = {
  total_correct: 0,
  total_attempted: 0,
  current_streak_weeks: 0,
  best_streak_weeks: 0,
  badges_earned: [],
  current_badge: null,
  last_answered_date: null,
  last_streak_week: null,
  perfect_week_groups: [],
};

export type BadgeDef = {
  id: string;
  name: string;
  icon: string;
  color: string;
  threshold?: number;
  description: string;
  bonus?: boolean;
};

export const LEVEL_BADGES: BadgeDef[] = [
  { id: "scam_aware",     name: "Scam Aware",       icon: "🌱", color: "#2ECC71", threshold: 1,   description: "Answer 1 question correctly" },
  { id: "scam_spotter",   name: "Scam Spotter",     icon: "🔍", color: "#ACD0DC", threshold: 10,  description: "Answer 10 questions correctly" },
  { id: "scam_defender",  name: "Scam Defender",    icon: "🛡️", color: "#DFC18F", threshold: 25,  description: "Answer 25 questions correctly" },
  { id: "scam_fighter",   name: "Scam Fighter",     icon: "⭐", color: "#F39C12", threshold: 50,  description: "Answer 50 questions correctly" },
  { id: "scam_guardian",  name: "Scam Guardian",    icon: "🏆", color: "#B27F7C", threshold: 100, description: "Answer 100 questions correctly" },
  { id: "scam_champion",  name: "Scam Champion",    icon: "💎", color: "#9B59B6", threshold: 200, description: "Answer 200 questions correctly" },
  { id: "scamshield_legend", name: "ScamShield Legend", icon: "👑", color: "#FFD700", threshold: 500, description: "Answer 500 questions correctly" },
];

export const BONUS_BADGES: BadgeDef[] = [
  { id: "perfect_week", name: "Perfect Week", icon: "🎯", color: "#2ECC71", bonus: true, description: "Score 5/5 in one rotation period" },
  { id: "on_fire",      name: "On Fire",      icon: "🔥", color: "#F39C12", bonus: true, description: "Achieve a 4-week streak" },
  { id: "ssn_hero",     name: "SSN Hero",     icon: "🛡️", color: "#ACD0DC", bonus: true, description: "Complete all SSN Shield checklist steps" },
  { id: "scholar",      name: "Scholar",      icon: "📚", color: "#DFC18F", bonus: true, description: "Read all 6 scam type cards fully" },
  { id: "team_player",  name: "Team Player",  icon: "👨‍👩‍👧", color: "#B27F7C", bonus: true, description: "Link 2 or more guardians to your account" },
];

export const ALL_BADGES: BadgeDef[] = [...LEVEL_BADGES, ...BONUS_BADGES];

export function badgeById(id: string | null | undefined): BadgeDef | null {
  if (!id) return null;
  return ALL_BADGES.find((b) => b.id === id) ?? null;
}

export function currentLevelBadge(totalCorrect: number): BadgeDef | null {
  let current: BadgeDef | null = null;
  for (const b of LEVEL_BADGES) {
    if (totalCorrect >= (b.threshold ?? 0)) current = b;
  }
  return current;
}

export function nextLevelBadge(totalCorrect: number): BadgeDef | null {
  for (const b of LEVEL_BADGES) {
    if (totalCorrect < (b.threshold ?? 0)) return b;
  }
  return null;
}

export function normalizeStats(raw: unknown): ChallengeStats {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<ChallengeStats>;
  return { ...DEFAULT_STATS, ...s, badges_earned: s.badges_earned ?? [], perfect_week_groups: s.perfect_week_groups ?? [] };
}

/** ISO week-of-epoch number — increments every 7 days. */
export function weekNumber(date = new Date()): number {
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24 * 7));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Apply a quiz answer. Returns the new stats and the list of newly earned badge ids.
 */
export function applyAnswer(
  stats: ChallengeStats,
  wasCorrect: boolean,
): { next: ChallengeStats; newBadges: BadgeDef[] } {
  const next: ChallengeStats = { ...stats, badges_earned: [...(stats.badges_earned ?? [])] };
  next.total_attempted += 1;
  if (wasCorrect) next.total_correct += 1;

  // Streak
  if (wasCorrect) {
    const wk = weekNumber();
    const last = stats.last_streak_week;
    if (last == null) {
      next.current_streak_weeks = 1;
    } else if (wk === last) {
      // already counted this week
    } else if (wk === last + 1) {
      next.current_streak_weeks = (stats.current_streak_weeks || 0) + 1;
    } else {
      next.current_streak_weeks = 1;
    }
    next.last_streak_week = wk;
    if (next.current_streak_weeks > next.best_streak_weeks) {
      next.best_streak_weeks = next.current_streak_weeks;
    }
    next.last_answered_date = todayISO();
  }

  // Newly earned level badges
  const newBadges: BadgeDef[] = [];
  for (const b of LEVEL_BADGES) {
    if ((b.threshold ?? 0) <= next.total_correct && !next.badges_earned.includes(b.id)) {
      next.badges_earned.push(b.id);
      newBadges.push(b);
    }
  }
  // On Fire bonus
  if (next.current_streak_weeks >= 4 && !next.badges_earned.includes("on_fire")) {
    next.badges_earned.push("on_fire");
    newBadges.push(BONUS_BADGES.find((b) => b.id === "on_fire")!);
  }

  // Update current badge to highest level earned
  const cur = currentLevelBadge(next.total_correct);
  next.current_badge = cur?.id ?? null;

  return { next, newBadges };
}

/** Apply a perfect week (5/5 in a rotation group). */
export function applyPerfectWeek(stats: ChallengeStats, group: number): { next: ChallengeStats; newBadges: BadgeDef[] } {
  const next: ChallengeStats = { ...stats, perfect_week_groups: [...(stats.perfect_week_groups ?? [])] };
  const newBadges: BadgeDef[] = [];
  if (!next.perfect_week_groups!.includes(group)) {
    next.perfect_week_groups!.push(group);
  }
  if (!next.badges_earned.includes("perfect_week")) {
    next.badges_earned = [...next.badges_earned, "perfect_week"];
    newBadges.push(BONUS_BADGES.find((b) => b.id === "perfect_week")!);
  }
  return { next, newBadges };
}
