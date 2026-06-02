import { useEffect, useState } from "react";

type Vignette = {
  name: string;
  age: number;
  emoji: string;
  scamType: string;
  story: string;
  takeaway: string;
};

const VIGNETTES: Vignette[] = [
  {
    name: "Margaret",
    age: 72,
    emoji: "👵",
    scamType: "Grandparent Scam",
    story:
      "Margaret got a frantic call: 'Grandma, it's me — I'm in jail, please don't tell Mom. I need $4,000 for bail.' The voice sounded just like her grandson. She almost wired the money before pausing to check.",
    takeaway: "Real family will let you verify. Scammers will not.",
  },
  {
    name: "Robert",
    age: 68,
    emoji: "👴",
    scamType: "Medicare Scam",
    story:
      "Robert received a polite call offering a 'free back brace' through Medicare. They just needed his Medicare number to confirm eligibility. The brace never came — but $1,200 in fraudulent charges did.",
    takeaway: "Medicare will never call you out of the blue for your number.",
  },
  {
    name: "Eleanor",
    age: 75,
    emoji: "🧓",
    scamType: "Romance Scam",
    story:
      "After six months of sweet messages, 'David' said he was stuck overseas and needed $3,500 for a flight home. Eleanor had never met him in person, but he felt like family. She sent the money. He vanished.",
    takeaway: "If you've never met them, do not send them money.",
  },
  {
    name: "Frank",
    age: 79,
    emoji: "👨‍🦳",
    scamType: "IRS Scam",
    story:
      "A stern voice told Frank he owed back taxes and the police were on their way unless he paid in gift cards. Frank drove to three stores buying $2,000 in cards before his daughter caught on.",
    takeaway: "The IRS never asks for gift cards. Ever.",
  },
];

export function ScamVignette() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % VIGNETTES.length), 7000);
    return () => clearInterval(t);
  }, []);
  const v = VIGNETTES[i];
  return (
    <section className="mt-12">
      <div className="text-center mb-4">
        <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--color-rose)" }}>
          Awareness
        </p>
        <h2 className="mt-1">Real Stories. Real Scams.</h2>
      </div>
      <div
        className="card-soft relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--color-sky) 70%, white), color-mix(in oklab, var(--color-cream) 80%, white))",
          border: "2px solid color-mix(in oklab, var(--color-rose) 22%, transparent)",
        }}
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <div className="text-5xl leading-none shrink-0" aria-hidden>{v.emoji}</div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold" style={{ fontSize: 18, color: "var(--color-brown)" }}>
              {v.name}, {v.age}
            </p>
            <p
              className="text-xs font-bold uppercase tracking-wider mt-0.5"
              style={{ color: "var(--color-rose)" }}
            >
              {v.scamType}
            </p>
            <p className="mt-3" style={{ fontSize: 16, lineHeight: 1.5 }}>
              {v.story}
            </p>
            <p
              className="mt-3 font-bold italic"
              style={{ color: "var(--color-brown)" }}
            >
              💡 {v.takeaway}
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Story navigation">
          {VIGNETTES.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === i}
              aria-label={`Show story ${idx + 1}`}
              onClick={() => setI(idx)}
              className="rounded-full transition-all"
              style={{
                width: idx === i ? 24 : 8,
                height: 8,
                background: idx === i ? "var(--color-rose)" : "color-mix(in oklab, var(--color-brown) 25%, transparent)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
