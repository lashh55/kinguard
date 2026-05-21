import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingShell } from "@/components/MarketingShell";

type Guide = {
  title: string;
  emoji: string;
  description: string;
  hook: string;
  howItWorks: string[];
  redFlags: string[];
  whatToDo: string[];
};

const GUIDES: Record<string, Guide> = {
  grandparent: {
    title: "Grandparent scam: how it works and how to stop it",
    emoji: "👵",
    description: "A panicked caller pretends to be a grandchild in trouble and demands bail money, legal fees, or hospital bills — usually in gift cards or wire transfer.",
    hook: "\"Grandma? It's me. Please don't tell Mom and Dad — I'm in jail and I need money for bail.\"",
    howItWorks: [
      "Caller claims to be a grandchild (or a lawyer or police officer calling on their behalf).",
      "Voice may sound off — they'll blame a cold, an injury, or a bad connection.",
      "They beg you not to tell other family members.",
      "They demand payment by gift cards, wire transfer, or cryptocurrency — usually within the hour.",
      "AI voice-cloning now lets scammers mimic a real grandchild from just a few seconds of social-media audio.",
    ],
    redFlags: [
      "Urgency and secrecy: \"Don't tell Mom.\"",
      "Payment in gift cards, wire transfer, crypto, or cash by courier.",
      "Refusal to let you call them back at a known number.",
      "Pressure to stay on the phone while you go to the store.",
    ],
    whatToDo: [
      "Hang up. Take a breath.",
      "Call your grandchild — or their parent — at a number you already have saved.",
      "Never send money based on a single phone call, no matter how convincing the voice.",
      "Report the call to the FTC at reportfraud.ftc.gov.",
    ],
  },
  medicare: {
    title: "Medicare scam: free braces, new cards, and threats to cancel benefits",
    emoji: "🏥",
    description: "Scammers impersonate Medicare to steal Medicare numbers, sign seniors up for fraudulent equipment claims, or extract payment for fake \"new\" cards.",
    hook: "\"This is Medicare. We need to verify your number before we can send your new card.\"",
    howItWorks: [
      "Cold calls offering \"free\" back braces, knee braces, or genetic testing kits.",
      "Threats that your benefits will be canceled unless you confirm your Medicare number.",
      "Fake offers of a new Medicare card with a chip — Medicare cards do not have chips.",
      "Door-to-door sales pitches for plans you didn't ask about.",
    ],
    redFlags: [
      "Anyone asking you to confirm your Medicare number over the phone.",
      "\"Free\" medical equipment in exchange for your Medicare ID.",
      "Unsolicited calls or visits — Medicare almost never calls you.",
      "Pressure to sign up the same day.",
    ],
    whatToDo: [
      "Never share your Medicare number with anyone who calls you.",
      "Hang up and call 1-800-MEDICARE (1-800-633-4227) if you have a real question.",
      "Report suspected Medicare fraud at 1-800-HHS-TIPS or oig.hhs.gov/fraud.",
    ],
  },
  irs: {
    title: "IRS impersonation scam: \"Pay now or be arrested\"",
    emoji: "🧾",
    description: "Scammers pose as IRS agents and threaten arrest, deportation, or license revocation unless you pay an alleged tax debt — usually in gift cards.",
    hook: "\"This is the IRS. A warrant has been issued for your arrest. Press 1 to speak with an agent.\"",
    howItWorks: [
      "Robocall or live caller claims you owe back taxes.",
      "Threatens arrest, lawsuit, deportation, or loss of driver's license.",
      "Demands payment in gift cards, prepaid debit cards, wire transfer, or cryptocurrency.",
      "May know the last four digits of your Social Security number — that does not make them real.",
      "Caller ID may be spoofed to show \"IRS\" or a Washington DC number.",
    ],
    redFlags: [
      "The real IRS will not call to demand immediate payment.",
      "The real IRS will not threaten to send police.",
      "The real IRS will not ask for payment in gift cards.",
      "The real IRS will not require a specific payment method.",
    ],
    whatToDo: [
      "Hang up immediately. Do not press any numbers.",
      "If you're unsure whether you owe taxes, call the IRS yourself at 1-800-829-1040.",
      "Report the call at tigta.gov/reportcrime-misconduct.",
    ],
  },
  ssn: {
    title: "Social Security scam: your number has NOT been suspended",
    emoji: "🔢",
    description: "Scammers call claiming your Social Security number has been suspended due to suspicious activity. Your SSN cannot be suspended — ever.",
    hook: "\"Your Social Security number has been suspended due to suspicious activity. Press 1 to speak with an officer.\"",
    howItWorks: [
      "Robocall says your SSN is suspended, frozen, or linked to a crime.",
      "Live \"officer\" demands you confirm your SSN and bank details to \"reactivate\" it.",
      "Sometimes they tell you to move your money to a \"safe\" government account.",
      "Caller ID may show the real Social Security Administration phone number — it is spoofed.",
    ],
    redFlags: [
      "Social Security numbers cannot be suspended. The claim itself is the scam.",
      "The SSA will never threaten arrest or demand immediate payment.",
      "The SSA will never ask you to move money to keep it safe.",
      "Anyone asking you to verify your SSN over the phone.",
    ],
    whatToDo: [
      "Hang up. Do not press 1.",
      "Never share your Social Security number over the phone.",
      "KinGuard will never ask for your SSN — and neither will any legitimate caller out of the blue.",
      "Report the call at oig.ssa.gov.",
    ],
  },
};

export const Route = createFileRoute("/scams/$slug")({
  loader: ({ params }) => {
    const guide = GUIDES[params.slug];
    if (!guide) throw notFound();
    return { guide, slug: params.slug };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Scam guide — KinGuard" }] };
    }
    const { guide } = loaderData;
    const url = `https://getkinguard.com/scams/${params.slug}`;
    return {
      meta: [
        { title: `${guide.title} — KinGuard` },
        { name: "description", content: guide.description },
        { property: "og:title", content: guide.title },
        { property: "og:description", content: guide.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          author: { "@type": "Organization", name: "KinGuard" },
          publisher: { "@type": "Organization", name: "KinGuard" },
        }),
      }],
    };
  },
  notFoundComponent: () => (
    <MarketingShell>
      <h1>Scam guide not found</h1>
      <p className="mt-3">We don't have a guide at this URL yet.</p>
      <Link to="/scams" className="btn-base btn-primary mt-6 inline-flex">See all scam guides</Link>
    </MarketingShell>
  ),
  errorComponent: ({ error, reset }) => (
    <MarketingShell>
      <h1>Something went wrong</h1>
      <p className="mt-3">{error.message}</p>
      <button onClick={reset} className="btn-base btn-primary mt-6">Try again</button>
    </MarketingShell>
  ),
  component: ScamGuide,
});

function ScamGuide() {
  const { guide } = Route.useLoaderData();
  return (
    <MarketingShell>
      <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--color-rose)" }}>
        <Link to="/scams">← All scam guides</Link>
      </p>
      <div className="text-5xl mt-4">{guide.emoji}</div>
      <h1 className="mt-2">{guide.title}</h1>
      <p className="mt-3" style={{ fontSize: 18 }}>{guide.description}</p>

      <blockquote
        className="mt-6 p-5 rounded-2xl italic"
        style={{ background: "color-mix(in oklab, var(--color-danger) 12%, #fff)", borderLeft: "4px solid var(--color-danger)" }}
      >
        {guide.hook}
      </blockquote>

      <Section title="How the scam works">
        <ol className="list-decimal pl-6 space-y-2">
          {guide.howItWorks.map((s: string, i: number) => <li key={i}>{s}</li>)}
        </ol>
      </Section>

      <Section title="Red flags" bg="color-mix(in oklab, #E74C3C 12%, #fff)">
        <ul className="list-disc pl-6 space-y-2">
          {guide.redFlags.map((s: string, i: number) => <li key={i}>{s}</li>)}
        </ul>
      </Section>

      <Section title="What to do" bg="color-mix(in oklab, #2ECC71 14%, #fff)">
        <ol className="list-decimal pl-6 space-y-2">
          {guide.whatToDo.map((s: string, i: number) => <li key={i}>{s}</li>)}
        </ol>
      </Section>

      <div className="mt-10 card-soft" style={{ background: "var(--color-sky)" }}>
        <h2>Not sure if a message is a scam?</h2>
        <p className="mt-2">Paste it into KinGuard's free scam checker and get an instant safety score.</p>
        <Link to="/" className="btn-base btn-primary mt-4 inline-flex">Check a message now</Link>
      </div>
    </MarketingShell>
  );
}

function Section({ title, children, bg }: { title: string; children: React.ReactNode; bg?: string }) {
  return (
    <section className="mt-8">
      <h2>{title}</h2>
      <div className="card-soft mt-3" style={{ background: bg }}>{children}</div>
    </section>
  );
}
