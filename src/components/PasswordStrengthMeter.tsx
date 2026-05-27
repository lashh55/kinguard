type Level = "empty" | "weak" | "good" | "strong";

function levelOf(len: number): Level {
  if (len === 0) return "empty";
  if (len < 10) return "weak";
  if (len < 14) return "good";
  return "strong";
}

const LABELS: Record<Level, string> = {
  empty: " ",
  weak: "Keep going",
  good: "Good",
  strong: "Strong",
};

const COLORS: Record<Level, string> = {
  empty: "#e5e7eb",
  weak: "#ef4444",
  good: "#f59e0b",
  strong: "#16a34a",
};

const FILLED: Record<Level, number> = { empty: 0, weak: 1, good: 2, strong: 3 };

export function PasswordStrengthMeter({ value }: { value: string }) {
  const lvl = levelOf(value.length);
  const filled = FILLED[lvl];
  const color = COLORS[lvl];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" role="presentation">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full transition-colors"
            style={{ background: i < filled ? color : "#e5e7eb" }}
          />
        ))}
      </div>
      <p className="text-sm mt-1 font-medium" style={{ color: lvl === "empty" ? "transparent" : color }}>
        {LABELS[lvl]}
      </p>
    </div>
  );
}
