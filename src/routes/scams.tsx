import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/MarketingShell";

const SCAMS = [
  { slug: "grandparent", emoji: "👵", title: "Grandparent scam", blurb: "A panicked call: \"Grandma, it's me — I'm in jail and need bail money.\" Here's how to spot it." },
  { slug: "medicare", emoji: "🏥", title: "Medicare scam", blurb: "Calls offering free back braces, new cards, or threatening to cancel benefits. What's real and what isn't." },
  { slug: "irs", emoji: "🧾", title: "IRS impersonation scam", blurb: "\"Pay now or be arrested.\" How real the IRS sounds — and what they will never do." },
  { slug: "ssn", emoji: "🔢", title: "Social Security scam", blurb: "Your SSN has NOT been suspended. Here's the exact playbook scammers use." },
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
    ],
    links: [{ rel: "canonical", href: "https://getkinguard.com/scams" }],
  }),
});

function ScamsHub() {
  return (
    <MarketingShell>
      <h1>Common scams targeting seniors</h1>
      <p className="mt-3" style={{ fontSize: 18 }}>
        Scammers rely on urgency, fear, and unfamiliar payment methods. Each guide below explains the exact script
        scammers use, the red flags to watch for, and what to do next.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {SCAMS.map((s) => (
          <Link key={s.slug} to={`/scams/${s.slug}`} className="card-soft block hover:opacity-90 transition">
            <div className="text-3xl mb-2">{s.emoji}</div>
            <h2 style={{ fontSize: 22 }}>{s.title}</h2>
            <p className="mt-2">{s.blurb}</p>
            <span className="inline-block mt-3 font-bold underline">Read the guide →</span>
          </Link>
        ))}
      </div>
      <div className="mt-10 card-soft" style={{ background: "var(--color-sky)" }}>
        <h2>Worried about a specific message?</h2>
        <p className="mt-2">KinGuard's free scam checker analyzes texts, emails, and call transcripts in seconds.</p>
        <Link to="/" className="btn-base btn-primary mt-4 inline-flex">Try the scam checker</Link>
      </div>
    </MarketingShell>
  );
}
