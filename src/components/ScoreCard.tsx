import { ReactNode } from "react";
import { ChallengeStats, currentLevelBadge, nextLevelBadge, normalizeStats } from "@/lib/badges";
import { useI18n } from "@/lib/i18n";

export function ScoreCard({ stats: raw, compact, tree }: { stats: unknown; compact?: boolean; tree?: ReactNode }) {
  const { t } = useI18n();
  const stats: ChallengeStats = normalizeStats(raw);
  const current = currentLevelBadge(stats.total_correct);
  const next = nextLevelBadge(stats.total_correct);
  const accuracy = stats.total_attempted > 0
    ? Math.round((stats.total_correct / stats.total_attempted) * 100)
    : 0;

  const progressBase = current?.threshold ?? 0;
  const progressTarget = next?.threshold ?? Math.max(progressBase + 1, stats.total_correct);
  const progressPct = next
    ? Math.min(100, Math.round(((stats.total_correct - progressBase) / (progressTarget - progressBase)) * 100))
    : 100;

  return (
    <div className="card-soft" style={{ background: "var(--color-cream)" }}>
      <div className="flex items-center gap-4">
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: compact ? 56 : 72,
            height: compact ? 56 : 72,
            background: current?.color ?? "var(--color-border)",
            fontSize: compact ? 32 : 40,
            color: "#fff",
          }}
        >
          {current?.icon ?? "🌱"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold" style={{ fontSize: 14, color: "var(--color-muted-foreground)" }}>{t("Current badge")}</p>
          <p className="font-extrabold" style={{ fontSize: compact ? 18 : 22 }}>
            {current?.name ?? t("Just getting started")}
          </p>
        </div>
        {tree && (
          <div style={{ width: compact ? 40 : 48, height: compact ? 40 : 48 }}>
            {tree}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <Stat label={t("Correct")} value={stats.total_correct} />
        <Stat label={t("Streak")} value={`${stats.current_streak_weeks} 🔥`} />
        <Stat label={t("Accuracy")} value={`${accuracy}%`} />
      </div>
      <div className="text-center mt-2 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
        {t("Best streak:")} <span className="font-bold">{stats.best_streak_weeks} {t("weeks")}</span>
      </div>

      {next && (
        <div className="mt-4">
          <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
            <div
              className="h-full transition-all"
              style={{ width: `${progressPct}%`, background: "#DFC18F" }}
            />
          </div>
          <p className="text-sm mt-2 text-center font-bold">
            {Math.max(0, progressTarget - stats.total_correct)} more correct answers to reach {next.name} {next.icon}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl py-2" style={{ background: "rgba(255,255,255,0.6)" }}>
      <p className="font-extrabold" style={{ fontSize: 20 }}>{value}</p>
      <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{label}</p>
    </div>
  );
}
