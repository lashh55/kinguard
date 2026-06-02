import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/MarketingShell";
import { ScamVignette } from "@/components/ScamVignette";


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
    ],
    links: [{ rel: "canonical", href: "https://getkinguard.com/for-guardians" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Does KinGuard listen to my parent's calls?", acceptedAnswer: { "@type": "Answer", text: "No. KinGuard only analyzes messages your parent chooses to paste into the app, or messages they forward for a check." } },
          { "@type": "Question", name: "How many guardians can a senior have?", acceptedAnswer: { "@type": "Answer", text: "Up to five. Each guardian gets the same real-time alerts and activity feed." } },
          { "@type": "Question", name: "Does KinGuard ask for a Social Security number?", acceptedAnswer: { "@type": "Answer", text: "Never. KinGuard does not collect, store, or transmit Social Security numbers." } },
        ],
      }),
    }],
  }),
});

function ForGuardians() {
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

      <section className="mt-12">
        <h2>What guardians actually see</h2>
        <ul className="mt-3 space-y-2 list-disc pl-6">
          <li>The scam category (grandparent, Medicare, IRS, romance, etc.)</li>
          <li>A risk score from 0–100</li>
          <li>When the check happened</li>
          <li><strong>Never</strong>: the message body, contacts, location, or financial info.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2>Common questions</h2>
        <Faq q="Does KinGuard listen to my parent's calls?" a="No. KinGuard only analyzes messages your parent chooses to paste into the app, or messages they forward for a check." />
        <Faq q="How many guardians can a senior have?" a="Up to five. Each guardian gets the same real-time alerts and activity feed." />
        <Faq q="Does KinGuard ask for a Social Security number?" a="Never. KinGuard does not collect, store, or transmit Social Security numbers. If you ever see a field asking for one, you're not on KinGuard." />
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
      <div className="text-3xl">{emoji}</div>
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
