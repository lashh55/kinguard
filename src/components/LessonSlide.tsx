import type { ComponentType } from "react";
import {
  ShieldCheck, Eye, User, MessageCircle, CalendarDays, Pencil, Globe, Lock, Settings,
  Star, Image as ImageIcon, MessageSquareText, Compass, BookOpen, Sprout, Check, X,
} from "lucide-react";
import p1 from "@/assets/lesson-photo-1.webp.asset.json";
import p2 from "@/assets/lesson-photo-2.webp.asset.json";
import p3 from "@/assets/lesson-photo-3.webp.asset.json";
import p4 from "@/assets/lesson-photo-4.webp.asset.json";
import p5 from "@/assets/lesson-photo-5.webp.asset.json";
import p6 from "@/assets/lesson-photo-6.webp.asset.json";
import p7 from "@/assets/lesson-photo-7.webp.asset.json";
import p8 from "@/assets/lesson-photo-8.webp.asset.json";
import p9 from "@/assets/lesson-photo-9.webp.asset.json";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
type Lesson = {
  photo: string;
  title: string;
  subtitle?: string;
  explanation?: string;
  icons?: { icon: Icon; label?: string }[];
  rows?: { icon: Icon; label: string }[];
  lists?: { heading: string; items: string[]; good: boolean }[];
};

/** English text is the dictionary key; Spanish lives in src/lib/translations/lessons.ts. */
export const LESSONS: Lesson[] = [
  { photo: p1.url, title: "Welcome to AI Empowerment", subtitle: "Tools for connection, confidence, and everyday living.",
    explanation: "AI (artificial intelligence) is technology that can answer questions and help with everyday tasks." },
  { photo: p2.url, title: "Using AI Safely", subtitle: "Protect yourself and use new tools with confidence.",
    icons: [{ icon: ShieldCheck, label: "Be Aware" }, { icon: Eye, label: "Be Smart" }, { icon: User, label: "Be Safe" }] },
  { photo: p3.url, title: "Keep Learning", subtitle: "Your journey with AI starts today." },
  { photo: p4.url, title: "AI in Your Everyday Life", subtitle: "Simple tools can make a big difference.",
    icons: [{ icon: MessageCircle, label: "Communicate" }, { icon: CalendarDays, label: "Plan" }, { icon: Pencil, label: "Create" }, { icon: Globe, label: "Explore" }] },
  { photo: p5.url, title: "Your Data Matters", subtitle: "Your privacy. Your choice.",
    icons: [{ icon: Lock, label: "Secure Your Data" }, { icon: ShieldCheck, label: "Control Your Info" }, { icon: Settings, label: "Stay Informed" }] },
  { photo: p6.url, title: "Hands-On AI", subtitle: "Try it. Explore it. Make it yours.",
    icons: [{ icon: Star }, { icon: ImageIcon }, { icon: MessageSquareText }] },
  { photo: p7.url, title: "Capabilities and Limitations",
    lists: [
      { heading: "What AI can do", good: true, items: ["Answer questions", "Help with tasks", "Spark ideas", "Support learning"] },
      { heading: "What AI can't do", good: false, items: ["Feel emotions", "Replace human judgment", "Always be 100% accurate", "Know your personal experiences"] },
    ] },
  { photo: p8.url, title: "Empowered Together.", subtitle: "Learning Together. Thriving Together." },
  { photo: p9.url, title: "Thank You",
    rows: [{ icon: Compass, label: "Keep exploring." }, { icon: BookOpen, label: "Keep learning." }, { icon: Sprout, label: "Keep growing." }] },
];

const GOLD = "var(--lesson-gold)";

export function LessonSlide({ index, t }: { index: number; t: (s: string) => string }) {
  const s = LESSONS[index];
  return (
    <div className="lesson-slide" role="group" aria-label={t("Lesson slide {n} of 9").replace("{n}", String(index + 1))}>
      <div className="lesson-slide__text">
        <h3 className="lesson-slide__title">{t(s.title)}</h3>
        <span className="lesson-slide__rule" aria-hidden="true" />
        {s.subtitle && <p className="lesson-slide__subtitle">{t(s.subtitle)}</p>}
        {s.explanation && <p className="lesson-slide__subtitle">{t(s.explanation)}</p>}
        {s.icons && (
          <ul className="lesson-slide__icons">
            {s.icons.map(({ icon: I, label }, k) => (
              <li key={k}>
                <span style={{ color: GOLD }}><I size={30} strokeWidth={1.6} aria-hidden /></span>
                {label && <span>{t(label)}</span>}
              </li>
            ))}
          </ul>
        )}
        {s.rows && (
          <ul className="lesson-slide__rows">
            {s.rows.map(({ icon: I, label }) => (
              <li key={label}>
                <span className="lesson-slide__ring" style={{ color: GOLD }}><I size={20} strokeWidth={1.6} aria-hidden /></span>
                {t(label)}
              </li>
            ))}
          </ul>
        )}
        {s.lists && (
          <div className="lesson-slide__lists">
            {s.lists.map((l) => (
              <div key={l.heading}>
                <p className="lesson-slide__list-heading" style={{ color: l.good ? "var(--lesson-green)" : "var(--lesson-red)" }}>
                  <span className="lesson-slide__mark" style={{ background: l.good ? "var(--lesson-green)" : "var(--lesson-red)" }}>
                    {l.good ? <Check size={12} strokeWidth={3} aria-hidden /> : <X size={12} strokeWidth={3} aria-hidden />}
                  </span>
                  {t(l.heading)}
                </p>
                <ul>{l.items.map((it) => <li key={it}>{t(it)}</li>)}</ul>
              </div>
            ))}
          </div>
        )}
        <span className="lesson-slide__num" aria-hidden="true">{index + 1}</span>
      </div>
      <div className="lesson-slide__photo">
        <img src={s.photo} alt="" loading={index === 0 ? "eager" : "lazy"} />
      </div>
    </div>
  );
}
