import { useState } from "react";
import { ALL_BADGES, BadgeDef, ChallengeStats, normalizeStats } from "@/lib/badges";

export function BadgeGrid({ stats: raw }: { stats: unknown }) {
  const stats: ChallengeStats = normalizeStats(raw);
  const [selected, setSelected] = useState<BadgeDef | null>(null);
  const earned = new Set(stats.badges_earned);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {ALL_BADGES.map((b) => {
          const isEarned = earned.has(b.id);
          return (
            <button
              key={b.id}
              onClick={() => setSelected(b)}
              className="rounded-2xl p-3 text-center"
              style={{
                background: isEarned ? b.color : "rgba(0,0,0,0.05)",
                opacity: isEarned ? 1 : 0.55,
                color: isEarned ? "#fff" : "var(--color-muted-foreground)",
                border: isEarned ? "none" : "2px dashed var(--color-border)",
              }}
            >
              <div style={{ fontSize: 36 }}>{isEarned ? b.icon : "🔒"}</div>
              <p className="text-xs font-bold mt-1">{b.name}</p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-5"
          style={{ background: "rgba(61,43,43,0.6)" }}
          onClick={() => setSelected(null)}
        >
          <div className="card-soft text-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div
              className="rounded-full mx-auto flex items-center justify-center"
              style={{
                width: 96, height: 96,
                background: earned.has(selected.id) ? selected.color : "rgba(0,0,0,0.08)",
                fontSize: 56,
                opacity: earned.has(selected.id) ? 1 : 0.7,
              }}
            >
              {earned.has(selected.id) ? selected.icon : "🔒"}
            </div>
            <h2 className="mt-3">{selected.name}</h2>
            <p className="mt-2">{selected.description}</p>
            <p className="mt-3 font-bold" style={{ color: earned.has(selected.id) ? "var(--color-safe)" : "var(--color-muted-foreground)" }}>
              {earned.has(selected.id) ? "✅ Earned!" : "🔒 Not yet earned"}
            </p>
            <button className="btn-base btn-outline w-full mt-3" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
