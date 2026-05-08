import { useMemo, useState } from "react";
import { BadgeDef } from "@/lib/badges";
import { toast } from "sonner";

const CONFETTI_COLORS = ["#ACD0DC", "#F6EFC1", "#DFC18F", "#B27F7C", "#2ECC71", "#F39C12"];

export function BadgeCelebration({
  badge,
  name,
  onDismiss,
}: {
  badge: BadgeDef;
  name: string;
  onDismiss: () => void;
}) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 1.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
      })),
    [badge.id],
  );

  const share = async () => {
    const text = `I just earned the ${badge.name} badge on ScamShield! I'm learning to stay safe from scams. 🛡️`;
    try {
      await navigator.clipboard.writeText(text);
      toast("✅ Copied! Share with friends and family.");
    } catch {
      toast(text);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(61,43,43,0.78)" }}
      onClick={onDismiss}
    >
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0.85; }
        }
        @keyframes badge-pop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {pieces.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: -20,
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.4,
              background: p.color,
              transform: `rotate(${p.rotate}deg)`,
              animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
              borderRadius: 2,
            }}
          />
        ))}
      </div>

      <div
        className="card-soft text-center mx-5 max-w-sm relative"
        style={{ animation: "badge-pop 0.6s ease-out", background: "#fff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-full mx-auto flex items-center justify-center"
          style={{
            width: 140,
            height: 140,
            background: badge.color,
            fontSize: 80,
          }}
        >
          {badge.icon}
        </div>
        <h2 className="mt-4">🎉 Congratulations {name.split(" ")[0]}!</h2>
        <p className="mt-2" style={{ fontSize: 18 }}>
          You just earned the <span className="font-extrabold">{badge.name}</span> badge!
        </p>
        <button className="btn-base btn-primary w-full mt-5" onClick={share}>
          📣 Share My Achievement
        </button>
        <button className="btn-base btn-outline w-full mt-2" onClick={onDismiss}>
          Continue
        </button>
        <p className="text-xs mt-3" style={{ color: "var(--color-muted-foreground)" }}>
          Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
}

/** Queue manager: show badges one at a time. */
export function useBadgeQueue() {
  const [queue, setQueue] = useState<BadgeDef[]>([]);
  const enqueue = (badges: BadgeDef[]) => {
    if (!badges.length) return;
    setQueue((q) => [...q, ...badges]);
  };
  const current = queue[0] ?? null;
  const dismiss = () => setQueue((q) => q.slice(1));
  return { current, enqueue, dismiss };
}

export function useNotifyGuardiansOfBadge() {
  // Surfaced as toast for now (mirrors guardianAlerts pattern).
  return (seniorName: string, badge: BadgeDef) => {
    const msg = `🌟 ${seniorName} just earned the ${badge.name} badge on ScamShield! They are building their scam protection skills.`;
    toast(msg, { duration: 4500, style: { whiteSpace: "pre-line" } });
  };
}


