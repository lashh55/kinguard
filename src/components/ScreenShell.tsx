import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { PhotoPanel } from "@/components/PhotoPanel";

export function ScreenShell({ children, withPhotoPanel = false }: { children: ReactNode; withPhotoPanel?: boolean }) {
  const { profile } = useAuth();
  const isGuardian = profile?.role === "guardian";
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {withPhotoPanel && <PhotoPanel widthPct={35} />}
      <main className={`flex-1 pb-28 max-w-xl w-full mx-auto ${withPhotoPanel ? "sm:mr-[35%] sm:ml-0" : ""}`}>{children}</main>
      <nav
        className="fixed bottom-0 left-0 right-0 border-t z-30"
        style={{ background: "var(--color-sky)" }}
      >
        <div className="max-w-xl mx-auto flex items-stretch justify-around">
          {isGuardian ? (
            <>
              <NavItem to="/dashboard" icon="🏠" label="Home" />
              <NavItem to="/profile" icon="👤" label="Profile" />
            </>
          ) : (
            <>
              <NavItem to="/dashboard" icon="🏠" label="Home" />
              <NavItem to="/check" icon="🔍" label="Check" />
              <NavItem to="/ssn" icon="🛡️" label="SSN" />
              <NavItem to="/learn" icon="🎓" label="Learn" />
              <NavItem to="/profile" icon="👤" label="Profile" />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: string; label: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to;
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center py-3 px-2 flex-1"
      style={{ minHeight: 64 }}
    >
      <span
        className="text-2xl"
        style={{ filter: active ? "none" : "grayscale(0.2)", color: active ? "var(--color-tan)" : "var(--color-brown)" }}
      >
        {icon}
      </span>
      <span
        className="text-xs font-bold mt-1"
        style={{ color: active ? "var(--color-tan)" : "var(--color-brown)" }}
      >
        {label}
      </span>
    </Link>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const cls = score <= 40 ? "badge-score-safe" : score <= 70 ? "badge-score-warn" : "badge-score-danger";
  return (
    <span className={`${cls} px-3 py-1 rounded-full text-sm font-bold`}>{score}</span>
  );
}

export function scoreColor(score: number) {
  return score <= 40 ? "var(--color-safe)" : score <= 70 ? "var(--color-warn)" : "var(--color-danger)";
}
