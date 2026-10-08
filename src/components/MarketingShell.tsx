import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export function MarketingShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-5 py-8">{children}</div>
      </main>
      <footer className="px-5 py-8 mt-12 border-t text-sm" style={{ borderColor: "color-mix(in oklab, var(--color-brown) 12%, transparent)", color: "var(--color-muted-foreground)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center text-center">
            <Link to="/privacy" className="hover:underline">{t("Privacy")}</Link>
            <Link to="/scams" className="hover:underline">{t("Scam guides")}</Link>
            <Link to="/for-guardians" className="hover:underline">{t("For guardians")}</Link>
          </div>
          <p className="text-center text-xs mt-4 leading-relaxed break-words">
            © {new Date().getFullYear()} KinGuard. {t("All rights reserved.")} | {t("Designed by")}{" "}
            <a
              href="https://empowerment4aillc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline underline-offset-4"
            >
              Empowerment4AILLC.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
