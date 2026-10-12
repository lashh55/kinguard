import { ChallengeStats, currentLevelBadge, nextLevelBadge, normalizeStats } from "@/lib/badges";
import { useI18n } from "@/lib/i18n";
import { BadgeIcon, CalendarSproutIcon, CheckRingIcon, SproutSoilIcon, TargetIcon } from "@/components/LearnIcons";

const GREEN = "#0F3D2A";

/** Learn-page version of the score card (dashboard keeps ScoreCard). Same numbers, new look. */
export function LearnScoreCard({ stats: raw }: { stats: unknown }) {
  const { t, lang } = useI18n();
  const es = lang === "es";
  const stats: ChallengeStats = normalizeStats(raw);
  const current = currentLevelBadge(stats.total_correct);
  const next = nextLevelBadge(stats.total_correct);
  const accuracy = stats.total_attempted > 0 ? Math.round((stats.total_correct / stats.total_attempted) * 100) : 0;
  const base = current?.threshold ?? 0;
  const target = next?.threshold ?? Math.max(base + 1, stats.total_correct);
  const pct = next ? Math.min(100, Math.round(((stats.total_correct - base) / (target - base)) * 100)) : 100;
  const n = Math.max(0, target - stats.total_correct);

  return (
    <div style={{ background: "#FBF1C9", borderRadius: 32, padding: 20, boxShadow: "0 8px 24px -12px rgba(61,43,43,0.25)" }}>
      <div className="flex items-center gap-4">
        <BadgeIcon level={current?.id ?? null} size={120} />
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 18, color: "#6B6B70" }}>{t("Current badge")}</p>
          <p className="font-extrabold" style={{ fontSize: 32, lineHeight: 1.1, color: GREEN }}>
            {current?.name ?? t("Just getting started")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <Stat icon={<CheckRingIcon />} value={stats.total_correct} label={t("Correct")} />
        <Stat icon={<CalendarSproutIcon size={44} />} value={stats.current_streak_weeks} label={t("Streak")} />
        <Stat icon={<TargetIcon />} value={`${accuracy}%`} label={t("Accuracy")} />
      </div>
      <p className="text-center mt-4" style={{ fontSize: 18, color: "#55565E" }}>
        {t("Best streak:")} <span className="font-bold" style={{ color: GREEN }}>{stats.best_streak_weeks} {t("weeks")}</span>
      </p>
      {next && (
        <div className="mt-4">
          <div className="h-4 w-full rounded-full overflow-hidden" style={{ background: "rgba(61,43,43,0.1)" }}>
            <div className="h-full transition-all" style={{ width: `${pct}%`, background: "#2E7D46" }} />
          </div>
          <p className="mt-3 text-center font-bold flex items-center justify-center gap-2" style={{ fontSize: 18, color: GREEN }}>
            {es
              ? `${n} ${n === 1 ? "respuesta correcta más" : "respuestas correctas más"} para llegar a ${next.name}`
              : `${n} more correct ${n === 1 ? "answer" : "answers"} to reach ${next.name}`}
            <SproutSoilIcon size={32} />
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ background: "rgba(255,255,255,0.6)", borderRadius: 24 }}>
      {icon}
      <div>
        <p className="font-extrabold" style={{ fontSize: 28, lineHeight: 1, color: GREEN }}>{value}</p>
        <p style={{ fontSize: 17, color: "#55565E" }}>{label}</p>
      </div>
    </div>
  );
}
