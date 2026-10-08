import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function BackToTop() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [bottom, setBottom] = useState(24);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      setVisible(window.scrollY >= window.innerHeight);
      const bottomNav = document.querySelector("[data-bottom-navigation]");
      const base = bottomNav ? bottomNav.getBoundingClientRect().height + 16 : 24;
      const footer = document.querySelector("footer")?.getBoundingClientRect();
      const footerOffset = footer && footer.top < window.innerHeight ? window.innerHeight - footer.top + 16 : 0;
      setBottom(Math.min(Math.max(base, footerOffset), window.innerHeight - 160));
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  if (!visible) return null;
  return <Button size="icon" className="site-back-to-top fixed right-4 z-30 h-14 w-14 rounded-full border-2 border-background bg-rose text-destructive-foreground shadow-lg hover:bg-rose/90" style={{ bottom }} aria-label={t("Back to top")} title={t("Back to top")} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}><ArrowUp aria-hidden="true" /></Button>;
}