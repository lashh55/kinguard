import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { PhotoPanel } from "@/components/PhotoPanel";
import { useI18n } from "@/lib/i18n";

export function ScreenShell({ children, withPhotoPanel = false }: { children: ReactNode; withPhotoPanel?: boolean }) {
  const { profile, user, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const isGuardian = profile?.role === "guardian";
  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {withPhotoPanel && <PhotoPanel widthPct={35} />}
      <div className={`flex-1 ${withPhotoPanel ? "sm:w-[65%]" : "w-full"}`}>
        {user && (
          <div
            className="sticky top-0 z-20 border-b"
            style={{ background: "var(--color-cream)", borderColor: "color-mix(in oklab, var(--color-brown) 12%, transparent)" }}
          >
            <div className="max-w-xl mx-auto flex items-center justify-end px-4 py-2">
              <button
                onClick={handleSignOut}
                aria-label={t("Sign Out")}
                className="btn-base"
                style={{ background: "var(--color-rose)", color: "#fff", minHeight: 44, padding: "8px 18px", fontSize: 16, fontWeight: 800 }}
              >
                {t("Sign Out")}
              </button>
            </div>
          </div>
        )}
        <main className="pb-28 max-w-xl w-full mx-auto">{children}</main>
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 border-t z-30"
        style={{ background: "var(--color-sky)" }}
      >
        <div className="max-w-xl mx-auto flex items-stretch justify-around">
          {isGuardian ? (
            <>
              <NavItem to="/dashboard" icon="🏠" label={t("Home")} />
              <NavItem to="/profile" icon="👤" label={t("Profile")} />
            </>
          ) : (
            <>
              <NavItem to="/dashboard" icon="🏠" label={t("Home")} />
              <NavItem to="/check" icon="🔍" label={t("Check")} />
              <NavItem to="/ssn" icon="🛡️" label="SSN" />
              <NavItem to="/learn" icon="🎓" label={t("Learn")} />
              <NavItem to="/profile" icon="👤" label={t("Profile")} />
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
