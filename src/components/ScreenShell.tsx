import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { PhotoPanel } from "@/components/PhotoPanel";
import { useI18n } from "@/lib/i18n";
import { BrandIcon } from "@/components/KinGuardIcon";
import homeIcon from "@/assets/kinguard-nav-home.webp.asset.json";
import checkIcon from "@/assets/kinguard-nav-check.webp.asset.json";
import learnIcon from "@/assets/kinguard-nav-learn.webp.asset.json";

type NavImage = { url: string };

export function ScreenShell({ children, withPhotoPanel = false }: { children: ReactNode; withPhotoPanel?: boolean }) {
  const { profile } = useAuth();
  const { t } = useI18n();
  const isGuardian = profile?.role === "guardian";
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {withPhotoPanel && <PhotoPanel widthPct={35} />}
      <div className={`flex-1 ${withPhotoPanel ? "sm:w-[65%]" : "w-full"}`}>
        <main className="pb-28 max-w-xl w-full mx-auto">{children}</main>
      </div>
      <nav
        data-bottom-navigation
        className="fixed bottom-0 left-0 right-0 border-t z-30"
        style={{ background: "var(--color-sky)" }}
      >
        <div className="max-w-xl mx-auto flex items-stretch justify-around">
          {isGuardian ? (
            <>
              <NavItem to="/dashboard" icon="🏠" image={homeIcon} label={t("Home")} />
              <NavItem to="/profile" icon="👤" label={t("Profile")} />
            </>
          ) : (
            <>
              <NavItem to="/dashboard" icon="🏠" image={homeIcon} label={t("Home")} />
              <NavItem to="/check" icon="🔍" image={checkIcon} label={t("Check")} />
              <NavItem to="/ssn" icon="🛡️" label="SSN" />
              <NavItem to="/learn" icon="🎓" image={learnIcon} label={t("Learn")} />
              <NavItem to="/profile" icon="👤" label={t("Profile")} />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, image }: { to: string; icon: string; label: string; image?: NavImage }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to;
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center py-3 px-2 flex-1"
      style={{ minHeight: 64 }}
    >
      <span
        className="text-2xl flex items-center justify-center"
        style={{
          minHeight: 30,
          filter: active ? "none" : "grayscale(0.2)",
          color: active ? "var(--color-tan)" : "var(--color-brown)",
        }}
      >
        {image ? (
          <img
            src={image.url}
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="kinguard-nav-icon"
          />
        ) : (
          <BrandIcon icon={icon} />
        )}
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
