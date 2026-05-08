import { useEffect, useState } from "react";
import { SENIOR_PHOTOS } from "@/lib/photos";

/**
 * Side photo panel that auto-cycles every 4s with a smooth fade.
 * Hidden on screens < 480px (returns null) per spec.
 */
export function PhotoPanel({ widthPct = 35, fixedHeight }: { widthPct?: number; fixedHeight?: string }) {
  const [i, setI] = useState(0);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const check = () => setHide(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (hide) return;
    const t = setInterval(() => setI((p) => (p + 1) % SENIOR_PHOTOS.length), 4000);
    return () => clearInterval(t);
  }, [hide]);

  if (hide) return null;

  return (
    <aside
      className="hidden sm:block fixed top-0 right-0 h-screen overflow-hidden"
      style={{ width: `${widthPct}%`, zIndex: 5 }}
      aria-hidden="true"
    >
      {SENIOR_PHOTOS.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: idx === i ? 1 : 0, height: fixedHeight ?? "100vh" }}
          loading="lazy"
        />
      ))}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to left, transparent 70%, rgba(245,245,245,0.4))" }} />
    </aside>
  );
}
