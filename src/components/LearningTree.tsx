import { useState } from "react";
import type { ChallengeStats } from "@/lib/badges";

const TRUNK = "#DFC18F";
const TRUNK_DARK = "#A8865A";
const LEAF = "#2E8B57";
const LEAF_LIGHT = "#5FBF7F";
const LEAF_BLOOM = "#F39C12";
const WILT = "#C9B27A";
const BARE = "#7A6248";

export type WiltLevel = "healthy" | "yellowing" | "bare" | "reset";

export function stageForCorrect(total: number): number {
  if (total >= 200) return 7;
  if (total >= 100) return 6;
  if (total >= 50) return 5;
  if (total >= 25) return 4;
  if (total >= 10) return 3;
  if (total >= 1) return 2;
  return 1;
}

const STAGE_NAMES = [
  "", "Tiny Seedling", "Small Sapling", "Young Tree",
  "Growing Tree", "Full Young Tree", "Large Full Tree", "Magnificent Bloom",
];

const NEXT_THRESHOLDS: Record<number, number> = { 1: 1, 2: 10, 3: 25, 4: 50, 5: 100, 6: 200 };

export function weeksSince(dateISO: string | null): number {
  if (!dateISO) return 0;
  const ms = Date.now() - new Date(dateISO).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
}

export function wiltLevel(weeks: number): WiltLevel {
  if (weeks >= 6) return "reset";
  if (weeks >= 4) return "bare";
  if (weeks >= 2) return "yellowing";
  return "healthy";
}

export function effectiveStage(stats: ChallengeStats): { stage: number; wilt: WiltLevel } {
  const wilt = wiltLevel(weeksSince(stats.last_answered_date));
  const baseStage = stageForCorrect(stats.total_correct);
  const stage = wilt === "reset" ? 1 : baseStage;
  return { stage, wilt };
}

function leafColor(wilt: WiltLevel, bloom = false) {
  if (wilt === "bare") return "transparent";
  if (wilt === "yellowing") return WILT;
  return bloom ? LEAF_BLOOM : LEAF;
}

function leafColorLight(wilt: WiltLevel) {
  if (wilt === "bare") return "transparent";
  if (wilt === "yellowing") return "#E0CC8C";
  return LEAF_LIGHT;
}

function TreeSVG({ stage, wilt }: { stage: number; wilt: WiltLevel }) {
  const branchStroke = wilt === "bare" ? BARE : TRUNK_DARK;
  const showLeaves = wilt !== "bare";

  return (
    <svg viewBox="0 0 100 120" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
      {/* Ground */}
      <ellipse cx="50" cy="115" rx="28" ry="3" fill="#C9B27A" opacity="0.4" />

      {stage === 1 && (
        <>
          <path d="M50 115 Q50 105 50 100" stroke={TRUNK_DARK} strokeWidth="2" fill="none" strokeLinecap="round" />
          {showLeaves && <ellipse cx="46" cy="100" rx="3" ry="5" fill={leafColor(wilt)} transform="rotate(-30 46 100)" />}
          {showLeaves && <ellipse cx="54" cy="100" rx="3" ry="5" fill={leafColor(wilt)} transform="rotate(30 54 100)" />}
        </>
      )}

      {stage === 2 && (
        <>
          <path d="M50 115 L50 90" stroke={TRUNK} strokeWidth="3" fill="none" strokeLinecap="round" />
          {showLeaves && (
            <>
              <ellipse cx="42" cy="90" rx="6" ry="9" fill={leafColor(wilt)} transform="rotate(-25 42 90)" />
              <ellipse cx="58" cy="90" rx="6" ry="9" fill={leafColor(wilt)} transform="rotate(25 58 90)" />
            </>
          )}
        </>
      )}

      {stage === 3 && (
        <>
          <path d="M50 115 L50 70" stroke={TRUNK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M50 85 L38 75 M50 80 L62 70" stroke={branchStroke} strokeWidth="2" strokeLinecap="round" />
          {showLeaves && (
            <>
              <circle cx="50" cy="65" r="12" fill={leafColor(wilt)} />
              <circle cx="38" cy="73" r="6" fill={leafColorLight(wilt)} />
              <circle cx="62" cy="68" r="6" fill={leafColorLight(wilt)} />
            </>
          )}
        </>
      )}

      {stage === 4 && (
        <>
          <path d="M50 115 L50 60" stroke={TRUNK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M50 80 L34 68 M50 75 L66 60 M50 88 L40 82" stroke={branchStroke} strokeWidth="2.5" strokeLinecap="round" />
          {showLeaves && (
            <>
              <circle cx="50" cy="55" r="16" fill={leafColor(wilt)} />
              <circle cx="34" cy="65" r="9" fill={leafColorLight(wilt)} />
              <circle cx="66" cy="58" r="9" fill={leafColorLight(wilt)} />
              <circle cx="40" cy="80" r="6" fill={leafColor(wilt)} />
            </>
          )}
        </>
      )}

      {stage === 5 && (
        <>
          <path d="M50 115 L50 55" stroke={TRUNK} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M50 75 L30 60 M50 70 L70 55 M50 85 L36 78 M50 80 L64 72" stroke={branchStroke} strokeWidth="2.5" strokeLinecap="round" />
          {showLeaves && (
            <>
              <circle cx="50" cy="48" r="20" fill={leafColor(wilt)} />
              <circle cx="30" cy="58" r="11" fill={leafColorLight(wilt)} />
              <circle cx="70" cy="52" r="11" fill={leafColorLight(wilt)} />
              <circle cx="36" cy="76" r="7" fill={leafColor(wilt)} />
              <circle cx="64" cy="70" r="7" fill={leafColor(wilt)} />
            </>
          )}
        </>
      )}

      {stage === 6 && (
        <>
          <path d="M50 115 L50 50" stroke={TRUNK} strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M50 70 L26 52 M50 65 L74 48 M50 82 L32 75 M50 78 L68 68 M50 90 L42 88" stroke={branchStroke} strokeWidth="3" strokeLinecap="round" />
          {showLeaves && (
            <>
              <circle cx="50" cy="40" r="24" fill={leafColor(wilt)} />
              <circle cx="26" cy="50" r="13" fill={leafColorLight(wilt)} />
              <circle cx="74" cy="46" r="13" fill={leafColorLight(wilt)} />
              <circle cx="32" cy="72" r="9" fill={leafColor(wilt)} />
              <circle cx="68" cy="66" r="9" fill={leafColor(wilt)} />
              <circle cx="50" cy="22" r="10" fill={leafColorLight(wilt)} />
            </>
          )}
        </>
      )}

      {stage === 7 && (
        <>
          <path d="M50 115 L50 48" stroke={TRUNK} strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M50 68 L22 48 M50 62 L78 44 M50 80 L28 72 M50 76 L72 64 M50 88 L40 86 M50 86 L60 84" stroke={branchStroke} strokeWidth="3" strokeLinecap="round" />
          {showLeaves && (
            <>
              <circle cx="50" cy="36" r="26" fill={leafColor(wilt)} />
              <circle cx="22" cy="46" r="14" fill={leafColorLight(wilt)} />
              <circle cx="78" cy="42" r="14" fill={leafColorLight(wilt)} />
              <circle cx="28" cy="70" r="10" fill={leafColor(wilt)} />
              <circle cx="72" cy="62" r="10" fill={leafColor(wilt)} />
              <circle cx="50" cy="14" r="12" fill={leafColorLight(wilt)} />
              {/* Blossoms */}
              <circle cx="36" cy="30" r="3" fill={leafColor(wilt, true)} />
              <circle cx="64" cy="26" r="3" fill={leafColor(wilt, true)} />
              <circle cx="50" cy="46" r="3" fill={leafColor(wilt, true)} />
              <circle cx="42" cy="50" r="2.5" fill={leafColor(wilt, true)} />
              <circle cx="58" cy="44" r="2.5" fill={leafColor(wilt, true)} />
            </>
          )}
        </>
      )}
    </svg>
  );
}

export function LearningTree({
  stats,
  size = 60,
  showLabel = false,
  onClick,
}: {
  stats: ChallengeStats;
  size?: number;
  showLabel?: boolean;
  onClick?: () => void;
}) {
  const { stage, wilt } = effectiveStage(stats);
  const next = NEXT_THRESHOLDS[stage];
  const remaining = next ? Math.max(0, next - stats.total_correct) : 0;

  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : undefined}>
      <div style={{ height: size, width: size, margin: "0 auto" }}>
        <TreeSVG stage={stage} wilt={wilt} />
      </div>
      {showLabel && (
        <div className="text-center mt-2">
          <p className="font-extrabold" style={{ fontSize: 17 }}>{STAGE_NAMES[stage]}</p>
          {next ? (
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              {remaining} correct answers to next stage
            </p>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              You've reached the highest stage! 🌳
            </p>
          )}
          {wilt === "yellowing" && <p className="text-sm mt-1" style={{ color: "#F39C12" }}>🍂 Your tree is starting to wilt — answer a question to perk it up!</p>}
          {wilt === "bare" && <p className="text-sm mt-1" style={{ color: "#E74C3C" }}>🥀 Your tree has lost its leaves — return to bring it back!</p>}
          {wilt === "reset" && <p className="text-sm mt-1" style={{ color: "#E74C3C" }}>🌱 Your tree reset to a seedling — start again to grow!</p>}
        </div>
      )}
    </div>
  );
}

export function LearningTreeWithTooltip(props: Parameters<typeof LearningTree>[0]) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative">
      <LearningTree {...props} onClick={() => { setShowTip((v) => !v); props.onClick?.(); }} />
      {showTip && (
        <div
          className="absolute left-1/2 -translate-x-1/2 mt-2 rounded-xl px-3 py-2 text-sm shadow-lg z-10"
          style={{ background: "#3D2B2B", color: "#fff", maxWidth: 240, top: "100%" }}
          onClick={(e) => { e.stopPropagation(); setShowTip(false); }}
        >
          Your learning tree grows as you complete challenges. Keep learning to help it thrive! 🌱
        </div>
      )}
    </div>
  );
}
