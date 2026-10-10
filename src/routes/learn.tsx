import { pageHead } from "@/lib/pageHead";
import { createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScoreCard } from "@/components/ScoreCard";
import { BadgeCelebration, useBadgeQueue, useNotifyGuardiansOfBadge } from "@/components/BadgeCelebration";
import { applyAnswer, applyPerfectWeek, normalizeStats } from "@/lib/badges";
import { LearningTree, LearningTreeWithTooltip } from "@/components/LearningTree";
import { useI18n } from "@/lib/i18n";
import { BadgeGrid } from "@/components/BadgeGrid";
import { track } from "@/lib/analytics";
import { BrandIcon } from "@/components/KinGuardIcon";
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
  head: () => pageHead("Learn to spot scams", "Explore KinGuard scam lessons, quizzes, and safety challenges."),
  component: LearnScreen,
});

const SLIDES = Array.from({ length: 9 }).map((_, i) => ({ title: `Slide ${i + 1}` }));

const SCAM_CARDS = [
  { id: "irs", icon: "🏛️", title: "IRS / Government Scams", look: "You get a call or email saying you owe back taxes and will be arrested if you don't pay immediately.", flags: ["Demands payment", "Gift cards", "Threatens arrest", "Unexpected contact"], doIt: "Hang up. The real IRS contacts you by mail first, never by phone.", accent: "var(--color-sky)" },
  { id: "tech", icon: "💻", title: "Tech Support Scams", look: "A popup or caller says your computer is infected and you need to pay to fix it.", flags: ["Unsolicited contact", "Remote access request", "Demands payment"], doIt: "Never give remote access to anyone you didn't contact first.", accent: "var(--color-sky)" },
  { id: "grand", icon: "👵", title: "Grandparent Scams", look: "Someone calls pretending to be your grandchild saying they're in jail and need money immediately.", flags: ["Urgent money request", "Don't tell family", "Gift cards or wire transfer"], doIt: "Hang up and call your grandchild on their real number to verify.", accent: "var(--color-sky)" },
  { id: "med", icon: "🏥", title: "Medicare / Health Scams", look: "Someone calls offering free equipment or asking for your Medicare number to keep benefits active.", flags: ["Asks for Medicare number", "Free equipment", "Benefits cancellation threat"], doIt: "Medicare never calls asking for your number unexpectedly.", accent: "var(--color-sky)" },
  { id: "rom", icon: "💔", title: "Romance Scams", look: "Someone meets you online — on Facebook, a dating app, or by text — and quickly says they love you. They seem perfect but always have an excuse not to meet in person. Eventually they ask for money.", flags: ["Never met in person", "Professes love very quickly", "Always has an emergency", "Asks for gift cards or wire transfer", "Too good to be true"], doIt: "Never send money to someone you have not met in person. Talk to a trusted family member before doing anything.", accent: "var(--color-rose)" },
  { id: "ssn", icon: "🛡️", title: "SSN Theft Scams", look: "Someone calls, emails, or texts claiming they need your Social Security Number to verify your identity or prevent account suspension.", flags: ["Unexpected contact", "Urgency", "Asks for full SSN", "Threatens consequences"], doIt: "Never share your SSN with someone who contacted you first. Use the SSN Shield in this app.", accent: "var(--color-rose)", linkSsn: true },
];

const VIDEOS = [
  { en: "How the IRS Scam Works", es: "Cómo funciona la estafa del IRS",
    dEn: "Scammers pretend to be the IRS and demand fast payment. The real IRS always contacts you by mail first.",
    dEs: "Los estafadores se hacen pasar por el IRS y exigen un pago inmediato. El IRS verdadero siempre se comunica primero por correo postal.",
    url: "https://www.ftc.gov/media/video-0118-irs-imposter-scams" },
  { en: "What a Tech Support Scam Sounds Like", es: "Cómo suena una estafa de soporte técnico",
    dEn: "Scammers pose as big-name companies and say your computer has a problem. Never let a stranger take control of your computer.",
    dEs: "Los estafadores se hacen pasar por empresas conocidas y dicen que su computadora tiene un problema. Nunca deje que un desconocido controle su computadora.",
    url: "https://consumer.ftc.gov/media/79958" },
  { en: "Grandparent Scam: How It Works", es: "La estafa del abuelo: cómo funciona",
    dEn: "A caller pretends to be a grandchild in trouble and begs you to send money and keep it secret. Ask for your family code word.",
    dEs: "Alguien llama haciéndose pasar por un nieto en apuros y le pide dinero y que guarde el secreto. Pida su palabra clave familiar.",
    url: "https://www.consumer.ftc.gov/media/video-0117-family-emergency-imposter-scams" },
  { en: "Romance Scams: Warning Signs", es: "Estafas románticas: señales de alerta",
    dEn: "If an online love interest asks for money, it is a scam, no matter how good the story sounds.",
    dEs: "Si un interés amoroso en línea le pide dinero, es una estafa, sin importar lo convincente que sea la historia.",
    url: "https://consumer.ftc.gov/media/video-0119-online-romance-imposter-scams" },
];

type Question = {
  id: string;
  question_text: string;
  answer_a: string; answer_b: string; answer_c: string; answer_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  explanation: string;
};

function LearnScreen() {
  const { profile, refreshProfile } = useAuth();
  const { current, enqueue, dismiss } = useBadgeQueue();
  const notifyGuardians = useNotifyGuardiansOfBadge();
  const { t } = useI18n();
  const hash = useLocation({ select: (location) => location.hash });
  useEffect(() => {
    if (hash !== "knowledge-tree" || !profile) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("knowledge-tree")?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, profile?.id]);
  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3"><h1>🎓 {t("Learn")}</h1></header>
      <Slides />
      <Cards />
      {profile && (
        <section id="knowledge-tree" className="px-5 mt-6">
          <h2 className="mb-2">{t("Knowledge Tree 🌳")}</h2>
          <ScoreCard
            stats={profile.challenge_stats}
            tree={
              <LearningTree
                stats={normalizeStats(profile.challenge_stats)}
                size={48}
              />
            }
          />
          <h2 className="mb-2 mt-6">{t("My Badges 🏅")}</h2>
          <BadgeGrid stats={profile.challenge_stats} />
        </section>
      )}
      <Quiz onBadges={(badges) => {
        if (!badges.length || !profile) return;
        enqueue(badges);
        badges.forEach((b) => notifyGuardians(profile.full_name, b));
        refreshProfile();
      }} />
      <Videos />
      <div className="px-5 mt-6 mb-4">
        <Link to="/dashboard" className="btn-base btn-outline w-full">{t("← Back to dashboard")}</Link>
      </div>

      {current && profile && (
        <BadgeCelebration badge={current} name={profile.full_name} onDismiss={dismiss} />
      )}
    </ScreenShell>
  );
}

function Slides() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  const { t } = useI18n();

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setI((p) => (p + 1) % SLIDES.length), 10000);
    return () => window.clearInterval(id);
  }, [paused]);

  const manual = (fn: (p: number) => number) => {
    setPaused(true);
    setI(fn);
  };

  return (
    <section className="px-5 mt-2">
      <h2 className="mb-2">{t("KinGuard Lessons")}</h2>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-cream)" }}
        onMouseEnter={() => setPaused(true)}
        onTouchStart={() => setPaused(true)}
      >
        <img
          src={SLIDE_IMAGES[i % SLIDE_IMAGES.length]}
          alt={`Lesson slide ${i + 1}`}
          className="w-full h-auto block"
        />
      </div>
      <div className="flex items-center justify-between mt-3">
        <button className="btn-base btn-outline" style={{ minHeight: 44, padding: "8px 14px" }} onClick={() => manual((p) => (p - 1 + SLIDES.length) % SLIDES.length)}>←</button>
        <button
          className="btn-base btn-outline"
          style={{ minHeight: 44, padding: "8px 14px" }}
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? t("Play") : t("Pause")}
        >
          {paused ? `▶ ${t("Play")}` : `⏸ ${t("Pause")}`}
        </button>
        <div className="flex gap-1">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => manual(() => idx)}
              className="rounded-full"
              style={{ width: 8, height: 8, background: idx === i ? "var(--color-rose)" : "var(--color-border)" }}
            />
          ))}
        </div>
        <button className="btn-base btn-outline" style={{ minHeight: 44, padding: "8px 14px" }} onClick={() => manual((p) => (p + 1) % SLIDES.length)}>→</button>
      </div>
    </section>
  );
}

function Cards() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [opened, setOpened] = useState<Set<string>>(new Set());

  const handleOpen = async (id: string) => {
    const next = new Set(opened);
    next.add(id);
    setOpened(next);
    if (!profile || profile.role !== "senior") return;
    if (next.size >= SCAM_CARDS.length) {
      const stats = normalizeStats(profile.challenge_stats);
      if (!stats.badges_earned.includes("scholar")) {
        const updated = { ...stats, badges_earned: [...stats.badges_earned, "scholar"] };
        await supabase.from("profiles").update({ challenge_stats: updated as any }).eq("id", profile.id);
        track("badge_earned", { badge_id: "scholar", badge_name: "Scholar" });
        toast("📚 You earned the Scholar badge!");
        refreshProfile();
      }
    }
  };

  return (
    <section className="px-5 mt-6">
      <h2>{t("Know Your Scams")}</h2>
      <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>{t("Tap any card to learn more")}</p>
      <div className="mt-3 space-y-3">
        {SCAM_CARDS.map((c) => (
          <details key={c.id} className="card-soft" style={{ borderTop: `6px solid ${c.accent}` }} onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) handleOpen(c.id); }}>
            <summary className="font-extrabold cursor-pointer" style={{ fontSize: 19 }}>
              <BrandIcon icon={c.icon} /> {t(c.title)}
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-bold">{t("What it looks like:")}</p>
                <p>"{c.look}"</p>
              </div>
              <div>
                <p className="font-bold">{t("Red flags:")}</p>
                <ul className="list-disc pl-5">{c.flags.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
              <div>
                <p className="font-bold">{t("What to do:")}</p>
                <p>{c.doIt}</p>
              </div>
              {c.linkSsn && (
                <button className="btn-base btn-rose w-full" onClick={() => navigate({ to: "/ssn" })}>{t("→ Go to SSN Shield")}</button>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Videos() {
  const { t, lang } = useI18n();
  const es = lang === "es";
  return (
    <section className="px-5 mt-6 mb-4">
      <h2>{t("Watch & Learn 🎥")}</h2>
      <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>
        {es ? "Videos cortos de la Comisión Federal de Comercio (FTC) sobre cómo detectar estafas comunes." : "Short videos from the Federal Trade Commission (FTC) on how to spot common scams."}
      </p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {VIDEOS.map((v) => (
          <div key={v.url} className="rounded-2xl overflow-hidden h-full flex flex-col" style={{ background: "var(--color-tan)" }}>
            <div className="flex items-center justify-center" style={{ height: 90 }}>
              <span style={{ fontSize: 40 }} aria-hidden="true">▶️</span>
            </div>
            <div className="p-3 bg-white flex-1 flex flex-col">
              <p className="font-bold" style={{ fontSize: 17 }}>{es ? v.es : v.en}</p>
              <p className="text-xs mt-1 font-bold" style={{ color: "var(--color-muted-foreground)" }}>1 min</p>
              <p className="text-sm mt-2 flex-1">{es ? v.dEs : v.dEn}</p>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="btn-base btn-primary w-full mt-4">
                {es ? "Ver en FTC.gov" : "Watch on FTC.gov"}
              </a>
              {es && <p className="text-xs mt-2 text-center" style={{ color: "var(--color-muted-foreground)" }}>Video en inglés</p>}
              <p className="text-xs mt-3 pt-2 text-center" style={{ color: "var(--color-muted-foreground)", borderTop: "1px solid var(--color-border)" }}>
                {es ? "Video: Comisión Federal de Comercio" : "Video: Federal Trade Commission"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Quiz({ onBadges }: { onBadges: (b: ReturnType<typeof applyAnswer>["newBadges"]) => void }) {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

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

  if (questions.length === 0) {
    return (
      <section className="px-5 mt-6">
        <h2>{t("This Week's Challenge 🧠")}</h2>
        <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>{t("Loading questions…")}</p>
      </section>
    );
  }
  const q = questions[idx];

  const choose = async (l: "a"|"b"|"c"|"d") => {
    if (picked || !profile) return;
    setPicked(l);
    const wasCorrect = l === q.correct_answer;
    if (wasCorrect) setCorrectCount((c) => c + 1);
    track("quiz_answered", { question_id: q.id, was_correct: wasCorrect, source: "learn" });
    await supabase.from("quiz_attempts").insert({
      user_id: profile.id,
      question_id: q.id,
      was_correct: wasCorrect,
    });
    if (profile.role !== "senior") return;

    const stats = normalizeStats(profile.challenge_stats);
    let { next, newBadges } = applyAnswer(stats, wasCorrect);

    // Perfect week check
    const isLast = idx === questions.length - 1;
    const willBePerfect = wasCorrect && isLast && (correctCount + 1) === questions.length;
    if (willBePerfect) {
      const pw = applyPerfectWeek(next, group);
      next = pw.next;
      newBadges = [...newBadges, ...pw.newBadges];
    }

    await supabase.from("profiles").update({ challenge_stats: next as any }).eq("id", profile.id);
    if (newBadges.length) onBadges(newBadges);
  };

  const next = () => {
    setPicked(null);
    setIdx((p) => Math.min(p + 1, questions.length - 1));
  };

  return (
    <section className="px-5 mt-6">
      <h2>{t("This Week's Challenge 🧠")}</h2>
      <p className="mt-1" style={{ color: "var(--color-muted-foreground)" }}>{t("Test what you know. Questions change every two weeks.")}</p>
      <div className="card-soft mt-3" style={{ background: "var(--color-cream)" }}>
        <p className="text-sm font-bold mb-2">{t("Question")} {idx + 1} {t("of")} {questions.length}</p>
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
              {picked === q.correct_answer ? `${t("✅ Correct!")} ` : `${t("❌ Not quite.")} `}
              {q.explanation}
            </p>
            {idx < questions.length - 1 && (
              <button className="btn-base btn-primary w-full mt-3" onClick={next}>{t("Next Question →")}</button>
            )}
            {idx === questions.length - 1 && (
              <p className="mt-3 font-bold text-center" style={{ color: "#2ECC71" }}>{t("🎉 You finished this week's challenge!")}</p>
            )}
          </>
        )}
      </div>
    </section>

  );
}
