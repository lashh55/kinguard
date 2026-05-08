import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import slide1 from "@/assets/slide-1.png";
import slide2 from "@/assets/slide-2.png";
import slide3 from "@/assets/slide-3.png";
import slide4 from "@/assets/slide-4.png";
import slide5 from "@/assets/slide-5.png";
import slide6 from "@/assets/slide-6.png";
import slide7 from "@/assets/slide-7.png";
import slide8 from "@/assets/slide-8.png";
import slide9 from "@/assets/slide-9.png";

const SLIDE_IMAGES = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9];

export const Route = createFileRoute("/learn")({
  component: LearnScreen,
});

const SLIDES = [
  { title: "Welcome to AI Empowerment", subtitle: "Tools for connection, confidence, and everyday living", points: ["Discover what AI can do for you", "Learn at your own pace", "You're never too late to start"] },
  { title: "Using AI Safely", subtitle: "Be Aware. Be Smart. Be Safe.", points: ["Know what to share", "Know what to skip", "Always verify before you trust"] },
  { title: "Keep Learning", subtitle: "Your journey with AI starts today", points: ["Small steps each week", "Ask questions freely", "Practice makes confidence"] },
  { title: "AI in Your Everyday Life", subtitle: "Communicate. Plan. Create. Explore.", points: ["Write emails faster", "Plan your day", "Find ideas and recipes"] },
  { title: "Your Data Matters", subtitle: "Secure Your Data. Control Your Info. Stay Informed.", points: ["Protect your passwords", "Limit what you share", "Check your privacy settings"] },
  { title: "Hands-On AI", subtitle: "Try it. Explore it. Make it yours.", points: ["Start with simple questions", "Use voice if it's easier", "Save what works for you"] },
  { title: "Capabilities and Limitations", subtitle: "What AI Can Do vs What AI Can't Do", points: ["Great at drafts and ideas", "Not always accurate", "Always double-check facts"] },
  { title: "Empowered Together", subtitle: "Learning Together. Thriving Together.", points: ["Lean on family and friends", "Share what you learn", "Help others stay safe too"] },
  { title: "Thank You", subtitle: "Keep exploring. Keep learning. Keep growing.", points: ["You did it!", "Come back anytime", "Stay curious"] },
];

const SCAM_CARDS = [
  { id: "irs", icon: "🏛️", title: "IRS / Government Scams", look: "You get a call or email saying you owe back taxes and will be arrested if you don't pay immediately.", flags: ["Demands payment", "Gift cards", "Threatens arrest", "Unexpected contact"], doIt: "Hang up. The real IRS contacts you by mail first, never by phone.", accent: "var(--color-sky)" },
  { id: "tech", icon: "💻", title: "Tech Support Scams", look: "A popup or caller says your computer is infected and you need to pay to fix it.", flags: ["Unsolicited contact", "Remote access request", "Demands payment"], doIt: "Never give remote access to anyone you didn't contact first.", accent: "var(--color-sky)" },
  { id: "grand", icon: "👵", title: "Grandparent Scams", look: "Someone calls pretending to be your grandchild saying they're in jail and need money immediately.", flags: ["Urgent money request", "Don't tell family", "Gift cards or wire transfer"], doIt: "Hang up and call your grandchild on their real number to verify.", accent: "var(--color-sky)" },
  { id: "med", icon: "🏥", title: "Medicare / Health Scams", look: "Someone calls offering free equipment or asking for your Medicare number to keep benefits active.", flags: ["Asks for Medicare number", "Free equipment", "Benefits cancellation threat"], doIt: "Medicare never calls asking for your number unexpectedly.", accent: "var(--color-sky)" },
  { id: "rom", icon: "💔", title: "Romance Scams", look: "Someone meets you online — on Facebook, a dating app, or by text — and quickly says they love you. They seem perfect but always have an excuse not to meet in person. Eventually they ask for money.", flags: ["Never met in person", "Professes love very quickly", "Always has an emergency", "Asks for gift cards or wire transfer", "Too good to be true"], doIt: "Never send money to someone you have not met in person. Talk to a trusted family member before doing anything.", accent: "var(--color-rose)" },
  { id: "ssn", icon: "🛡️", title: "SSN Theft Scams", look: "Someone calls, emails, or texts claiming they need your Social Security Number to verify your identity or prevent account suspension.", flags: ["Unexpected contact", "Urgency", "Asks for full SSN", "Threatens consequences"], doIt: "Never share your SSN with someone who contacted you first. Use the SSN Shield in this app.", accent: "var(--color-rose)", linkSsn: true },
];

const VIDEOS = [
  { title: "How the IRS Scam Works", dur: "3 min" },
  { title: "What a Tech Support Scam Sounds Like", dur: "4 min" },
  { title: "Grandparent Scam: A Real Story", dur: "5 min" },
  { title: "Romance Scams: Warning Signs", dur: "4 min" },
  { title: "How to Freeze Your Credit", dur: "6 min" },
  { title: "What To Do If You Were Scammed", dur: "5 min" },
];

type Question = {
  id: string;
  question_text: string;
  answer_a: string; answer_b: string; answer_c: string; answer_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  explanation: string;
};

function LearnScreen() {
  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3"><h1>🎓 Learn</h1></header>
      <Slides />
      <Cards />
      <Videos />
      <Quiz />
    </ScreenShell>
  );
}

function Slides() {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  return (
    <section className="px-5 mt-2">
      <h2 className="mb-2">ScamShield Lessons</h2>
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-cream)", minHeight: 280 }}>
        <img
          src={SLIDE_IMAGES[i % SLIDE_IMAGES.length]}
          alt=""
          className="w-full object-cover"
          style={{ height: 200 }}
        />
        <div className="p-5">
          <p className="font-extrabold" style={{ fontSize: 24 }}>{s.title}</p>
          <p className="mt-1 italic">{s.subtitle}</p>
          <ul className="mt-3 space-y-1 list-disc pl-5">
            {s.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <button className="btn-base btn-outline" style={{ minHeight: 44, padding: "8px 14px" }} onClick={() => setI((p) => (p - 1 + SLIDES.length) % SLIDES.length)}>←</button>
        <div className="flex gap-1">
          {SLIDES.map((_, idx) => (
            <span key={idx} className="rounded-full" style={{ width: 8, height: 8, background: idx === i ? "var(--color-rose)" : "var(--color-border)" }} />
          ))}
        </div>
        <button className="btn-base btn-outline" style={{ minHeight: 44, padding: "8px 14px" }} onClick={() => setI((p) => (p + 1) % SLIDES.length)}>→</button>
      </div>
    </section>
  );
}

function Cards() {
  const navigate = useNavigate();
  return (
    <section className="px-5 mt-6">
      <h2>Know Your Scams</h2>
      <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>Tap any card to learn more</p>
      <div className="mt-3 space-y-3">
        {SCAM_CARDS.map((c) => (
          <details key={c.id} className="card-soft" style={{ borderTop: `6px solid ${c.accent}` }}>
            <summary className="font-extrabold cursor-pointer" style={{ fontSize: 19 }}>
              {c.icon} {c.title}
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-bold">What it looks like:</p>
                <p>"{c.look}"</p>
              </div>
              <div>
                <p className="font-bold">Red flags:</p>
                <ul className="list-disc pl-5">{c.flags.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
              <div>
                <p className="font-bold">What to do:</p>
                <p>{c.doIt}</p>
              </div>
              {c.linkSsn && (
                <button className="btn-base btn-rose w-full" onClick={() => navigate({ to: "/ssn" })}>→ Go to SSN Shield</button>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Videos() {
  return (
    <section className="px-5 mt-6">
      <h2>Watch & Learn 🎥</h2>
      <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>Real scam situations explained in plain language</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {VIDEOS.map((v) => (
          <button
            key={v.title}
            className="rounded-2xl overflow-hidden text-left"
            style={{ background: "var(--color-tan)" }}
            onClick={() => toast("This video is coming soon! Check back for updates.")}
          >
            <div className="relative flex items-center justify-center" style={{ height: 110 }}>
              <span style={{ fontSize: 40 }}>▶️</span>
              <span className="absolute top-2 right-2 text-xs font-bold rounded-full px-2 py-1" style={{ background: "var(--color-rose)", color: "#fff" }}>Coming Soon</span>
            </div>
            <div className="p-3 bg-white">
              <p className="font-bold" style={{ fontSize: 15 }}>{v.title}</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>{v.dur}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function Quiz() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const group = useMemo(() => {
    const weeks = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 14));
    return (weeks % 6) + 1;
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("quiz_questions")
        .select("id,question_text,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation")
        .eq("rotation_group", group)
        .limit(5);
      setQuestions((data ?? []) as Question[]);
    })();
  }, [group]);

  if (questions.length === 0) return null;
  const q = questions[idx];

  const choose = async (l: "a"|"b"|"c"|"d") => {
    if (picked) return;
    setPicked(l);
    if (profile?.id) {
      await supabase.from("quiz_attempts").insert({
        user_id: profile.id,
        question_id: q.id,
        was_correct: l === q.correct_answer,
      });
    }
  };

  const next = () => {
    setPicked(null);
    setIdx((p) => Math.min(p + 1, questions.length - 1));
  };

  return (
    <section className="px-5 mt-6 mb-4">
      <h2>This Week's Challenge 🧠</h2>
      <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>Test what you know. Questions change every two weeks.</p>
      <div className="card-soft mt-3" style={{ background: "var(--color-cream)" }}>
        <p className="text-sm font-bold mb-2">Question {idx + 1} of {questions.length}</p>
        <p className="font-bold" style={{ fontSize: 20 }}>{q.question_text}</p>
        <div className="mt-3 space-y-2">
          {(["a","b","c","d"] as const).map((l) => {
            const txt = q[`answer_${l}` as const];
            let style: React.CSSProperties = {};
            if (picked) {
              if (l === picked && l === q.correct_answer) style = { background: "#2ECC71", color: "#fff" };
              else if (l === picked) style = { background: "#E74C3C", color: "#fff" };
              else if (l === q.correct_answer) style = { background: "#2ECC71", color: "#fff", opacity: 0.85 };
            }
            return (
              <button key={l} className="btn-base btn-sky w-full justify-start text-left" style={style} disabled={!!picked} onClick={() => choose(l)}>
                <span className="font-extrabold mr-2">{l.toUpperCase()}.</span> {txt}
              </button>
            );
          })}
        </div>
        {picked && (
          <>
            <p className="mt-3" style={{ fontSize: 17 }}>
              {picked === q.correct_answer ? "✅ Correct! " : "❌ Not quite. "}
              {q.explanation}
            </p>
            {idx < questions.length - 1 && (
              <button className="btn-base btn-primary w-full mt-3" onClick={next}>Next Question →</button>
            )}
            {idx === questions.length - 1 && (
              <p className="mt-3 font-bold text-center" style={{ color: "#2ECC71" }}>🎉 You finished this week's challenge!</p>
            )}
          </>
        )}
      </div>
      <Link to="/dashboard" className="btn-base btn-outline w-full mt-3">← Back to dashboard</Link>
    </section>
  );
}
