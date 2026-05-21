import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import logo from "@/assets/kinguard-logo.png";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 py-4 border-b" style={{ borderColor: "color-mix(in oklab, var(--color-brown) 12%, transparent)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="KinGuard" className="w-10 h-10 object-contain" />
            <span className="font-extrabold" style={{ color: "var(--color-rose)", fontSize: 22 }}>KinGuard</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-bold">
            <Link to="/scams" className="underline-offset-4 hover:underline">Common scams</Link>
            <Link to="/for-guardians" className="underline-offset-4 hover:underline">For guardians</Link>
            <Link to="/" className="btn-base btn-primary px-4 py-2 text-sm">Get protected</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-5 py-8">{children}</div>
      </main>
      <footer className="px-5 py-8 mt-12 border-t text-sm" style={{ borderColor: "color-mix(in oklab, var(--color-brown) 12%, transparent)", color: "var(--color-muted-foreground)" }}>
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-between">
          <span>© {new Date().getFullYear()} empowerment4life LLC</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/scams" className="hover:underline">Scam guides</Link>
            <Link to="/for-guardians" className="hover:underline">For guardians</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
