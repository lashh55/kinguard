import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

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

const ROTATE_MS = 10000;

export function ScamVignette() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (paused || hovered) return;
    const t = setInterval(() => setI((n) => (n + 1) % VIGNETTES.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, hovered]);

  const v = VIGNETTES[i];
  const prev = () => setI((n) => (n - 1 + VIGNETTES.length) % VIGNETTES.length);
  const next = () => setI((n) => (n + 1) % VIGNETTES.length);

  const arrowStyle: React.CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: 9999,
    background: "white",
    border: "2px solid color-mix(in oklab, var(--color-rose) 40%, transparent)",
    color: "var(--color-brown)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  };

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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-start gap-4">
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
            <p className="mt-3 font-bold italic" style={{ color: "var(--color-brown)" }}>
              💡 {v.takeaway}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            onClick={prev}
            aria-label="Previous story"
            style={arrowStyle}
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume auto-rotate" : "Pause auto-rotate"}
            className="inline-flex items-center gap-2 font-bold"
            style={{
              padding: "10px 18px",
              borderRadius: 9999,
              background: "white",
              border: "2px solid color-mix(in oklab, var(--color-rose) 40%, transparent)",
              color: "var(--color-brown)",
              fontSize: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {paused ? <Play size={20} /> : <Pause size={20} />}
            {paused ? "Play" : "Pause"}
          </button>

          <button
            onClick={next}
            aria-label="Next story"
            style={arrowStyle}
          >
            <ChevronRight size={28} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex justify-center gap-3 mt-5" role="tablist" aria-label="Story navigation">
          {VIGNETTES.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === i}
              aria-label={`Show story ${idx + 1}`}
              onClick={() => setI(idx)}
              className="rounded-full transition-all"
              style={{
                width: idx === i ? 40 : 18,
                height: 18,
                background:
                  idx === i
                    ? "var(--color-rose)"
                    : "color-mix(in oklab, var(--color-brown) 30%, transparent)",
                border: "none",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
