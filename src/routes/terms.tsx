import { createFileRoute, Link } from "@tanstack/react-router";
import { ScreenShell } from "@/components/ScreenShell";
import { GuardianDisclaimer } from "@/components/GuardianDisclaimer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/pageHead";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => pageHead("Terms of Service", "KinGuard guardian responsibilities, trust, and your right to remove a guardian."),
});

function TermsPage() {
  const { lang } = useI18n();
  const es = lang === "es";
  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3">
        <h1>{es ? "Términos de servicio" : "Terms of Service"}</h1>
      </header>
      <section className="px-5 py-4">
        <h2 className="mb-3">{es ? "Sus guardianes" : "Your guardians"}</h2>
        <GuardianDisclaimer />
      </section>
      <div className="px-5 py-4">
        <Button asChild variant="outline"><Link to="/privacy">{es ? "Privacidad" : "Privacy"}</Link></Button>
      </div>
    </ScreenShell>
  );
}