import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/MarketingShell";
import { useI18n } from "@/lib/i18n";
import iconGuideGrandparent from "@/assets/learn-icons/icon-guide-grandparent.png.asset.json";
import iconGuideSocialSecurity from "@/assets/learn-icons/icon-guide-social-security.png.asset.json";
import iconMedicareHealth from "@/assets/learn-icons/icon-medicare-health.png.asset.json";
import iconIrsSsa from "@/assets/kinguard-check-irs-ssa.webp.asset.json";

const SCAMS = [
  { slug: "grandparent", icon: iconGuideGrandparent, circled: false, title: "Grandparent scam", blurb: "A panicked call: \"Grandma, it's me — I'm in jail and need bail money.\" Here's how to spot it." },
  { slug: "medicare", icon: iconMedicareHealth, circled: true, title: "Medicare scam", blurb: "Calls offering free back braces, new cards, or threatening to cancel benefits. What's real and what isn't." },
  { slug: "irs", icon: iconIrsSsa, circled: true, title: "IRS impersonation scam", blurb: "\"Pay now or be arrested.\" How real the IRS sounds — and what they will never do." },
  { slug: "ssn", icon: iconGuideSocialSecurity, circled: false, title: "Social Security scam", blurb: "Your SSN has NOT been suspended. Here's the exact playbook scammers use." },
];

export const Route = createFileRoute("/scams")({
  component: ScamsHub,
  head: () => ({
    meta: [
      { title: "Common scams targeting seniors — KinGuard" },
      { name: "description", content: "Plain-language guides to the most common scams targeting seniors: grandparent calls, Medicare, IRS impersonation, and Social Security threats." },
      { property: "og:title", content: "Common scams targeting seniors — KinGuard" },
      { property: "og:description", content: "Plain-language guides to the most common scams targeting seniors and their families." },
      { property: "og:url", content: "https://getkinguard.com/scams" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://getkinguard.com/scams" }],
  }),
});

function ScamsHub() {
  const { t } = useI18n();
  return (
    <MarketingShell>
      <h1>{t("Common scams targeting seniors")}</h1>
      <p className="mt-3" style={{ fontSize: 18 }}>
        {t("Scammers rely on urgency, fear, and unfamiliar payment methods. Each guide below explains the exact script scammers use, the red flags to watch for, and what to do next.")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {SCAMS.map((s) => (
          <Link key={s.slug} to="/scams/$slug" params={{ slug: s.slug }} className="card-soft block hover:opacity-90 transition">
            <div className="flex items-center gap-4">
              {s.circled ? (
                <span className="kg-guide-circle">
                  <img src={s.icon.url} alt="" className="kg-guide-icon" />
                </span>
              ) : (
                <img src={s.icon.url} alt="" className="kg-guide-icon-solo" />
              )}
              <div>
                <h2 className="font-bold" style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "#0F3D2A" }}>{t(s.title)}</h2>
                <p className="mt-2">{t(s.blurb)}</p>
                <span className="inline-block mt-3 font-bold underline" style={{ color: "#0F3D2A" }}>{t("Read the guide →")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-10 card-soft" style={{ background: "var(--color-sky)" }}>
        <h2>{t("Worried about a specific message?")}</h2>
        <p className="mt-2">{t("KinGuard's free scam checker analyzes texts, emails, and call transcripts in seconds.")}</p>
        <Link to="/" className="btn-base btn-primary mt-4 inline-flex">{t("Try the scam checker")}</Link>
      </div>
    </MarketingShell>
  );
}
