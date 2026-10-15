import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/MarketingShell";
import { ScamVignette } from "@/components/ScamVignette";
import { BrandIcon } from "@/components/KinGuardIcon";
import { useI18n } from "@/lib/i18n";


export const Route = createFileRoute("/for-guardians")({
  component: ForGuardians,
  head: () => ({
    meta: [
      { title: "For guardians: protect a parent or grandparent from scams — KinGuard" },
      { name: "description", content: "KinGuard alerts adult children and caregivers the moment a parent or grandparent receives a suspicious call, text, or email. Free to start." },
      { property: "og:title", content: "For guardians: protect a parent from scams — KinGuard" },
      { property: "og:description", content: "Real-time scam alerts for the adult children and caregivers of seniors." },
      { property: "og:url", content: "https://getkinguard.com/for-guardians" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://getkinguard.com/for-guardians" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Does KinGuard listen to my parent's calls?", acceptedAnswer: { "@type": "Answer", text: "No. KinGuard only analyzes messages your parent chooses to paste into the app, or messages they forward for a check." } },
           { "@type": "Question", name: "How many guardians can a senior have?", acceptedAnswer: { "@type": "Answer", text: "Up to three. Each guardian gets the same real-time alerts and activity feed." } },
          { "@type": "Question", name: "Does KinGuard ask for a Social Security number?", acceptedAnswer: { "@type": "Answer", text: "Never. KinGuard does not collect, store, or transmit Social Security numbers." } },
        ],
      }),
    }],
  }),
});

function ForGuardians() {
  const { t } = useI18n();
  return (
    <MarketingShell>
      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--color-rose)" }}>For guardians</p>
      <h1 className="mt-2">Know the moment a scammer targets your parent.</h1>
      <p className="mt-4" style={{ fontSize: 18 }}>
        KinGuard sits quietly in the background. When your mom, dad, or grandparent receives a suspicious text,
        email, or call, they tap one button to check it — and you get an instant alert with the scam type and
        risk score. No invasive monitoring. No SSN. No guesswork.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <Feature emoji="🛡️" title="Senior signs up">They get a simple, large-text app and a 6-character invite code.</Feature>
        <Feature emoji="💙" title="You connect">Enter the invite code, name your relationship, and you're linked.</Feature>
        <Feature emoji="🔔" title="You get alerts">Real-time notifications whenever they check a suspicious message.</Feature>
      </div>

      <ScamVignette />


      <section className="mt-12">
        <h2>What guardians actually see</h2>
        <ul className="mt-3 space-y-2 list-disc pl-6">
          <li>The scam category (grandparent, Medicare, IRS, romance, etc.)</li>
          <li>A risk score from 0–100</li>
          <li>When the check happened</li>
          <li><strong>Never</strong>: the message body, contacts, location, or financial info.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2>{t("How to help protect your loved one")}</h2>
        <ol className="mt-4 space-y-4">
          {HELP_TIPS.map((tip, i) => (
            <li key={tip.title} className="card-soft flex items-start gap-4">
              <span
                className="shrink-0 rounded-full flex items-center justify-center font-extrabold"
                style={{ width: 40, height: 40, background: "var(--color-sky)", color: "var(--color-brown)", fontSize: 20 }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-extrabold" style={{ fontSize: 20 }}>{t(tip.title)}</h3>
                <p className="mt-1" style={{ fontSize: 18 }}>{t(tip.body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">

        <h2>Common questions</h2>
        <Faq q="Does KinGuard listen to my parent's calls?" a="No. KinGuard only analyzes messages your parent chooses to paste into the app, or messages they forward for a check." />
        <Faq q={t("How many guardians can a senior have?")} a={t("Up to three. Each guardian gets the same real-time alerts and activity feed.")} />
        <Faq q="Does KinGuard ask for a Social Security number?" a="Never. KinGuard does not collect, store, or transmit Social Security numbers. If you ever see a field asking for one, you're not on KinGuard." />
        <Faq q={t("Can I use KinGuard if I don't have family?")} a={t("Yes. KinGuard is free for every senior. You can choose anyone you trust as your guardian, like a neighbor, church member, or friend. When our new family features launch, seniors without family can request a free sponsored plan from their Profile page.")} />
        <Faq q="What does it cost?" a="Free to get started. You can connect as a guardian in under two minutes." />
      </section>

      <div className="mt-10 card-soft text-center" style={{ background: "var(--color-sky)" }}>
        <h2>Ready to protect someone you love?</h2>
        <p className="mt-2">Have them create an account first — they'll get an invite code to share with you.</p>
        <Link to="/" className="btn-base btn-primary mt-4 inline-flex">Get started</Link>
      </div>
    </MarketingShell>
  );
}

function Feature({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card-soft">
      <div className="text-3xl"><BrandIcon icon={emoji} /></div>
      <h3 className="mt-2 font-extrabold">{title}</h3>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="mt-4">
      <p className="font-extrabold">{q}</p>
      <p className="mt-1">{a}</p>
    </div>
  );
}

const HELP_TIPS = [
  {
    title: "Suspicious emails",
    body: "Don't just delete it. Mark it as spam or phishing so the email service learns to block it. In Gmail, open the email, tap the three dots, and choose 'Report phishing.' Then forward it to KinGuard to check.",
  },
  {
    title: "Scam text messages",
    body: "Forward the text to 7726 (it spells SPAM), then block the number. Never tap links in unexpected texts.",
  },
  {
    title: "Scam phone calls",
    body: "Register their number at donotcall.gov. Turn on your phone carrier's free scam-call blocking, and block numbers that call repeatedly.",
  },
  {
    title: "Protect their money",
    body: "Help them set up bank alerts for large withdrawals. Ask their bank about adding you as a trusted contact. Consider a free credit freeze using the SSN Shield page.",
  },
  {
    title: "Report scams",
    body: "Report scams at reportfraud.ftc.gov. For online fraud, also report at ic3.gov. Reporting helps stop scammers and can help recover money.",
  },
  {
    title: "Talk without shame",
    body: "Check in every week. If your loved one is scammed, never blame them. Shame keeps people silent, and silence is what scammers count on.",
  },
  {
    title: "Set up the family code word together",
    body: "Choose the code word with your loved one, in person or by phone. Make sure every family member knows it, and never share it by text or email.",
  },
];

