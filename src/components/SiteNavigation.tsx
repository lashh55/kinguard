import { useSignOutConfirm } from "@/components/SignOutConfirm";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import logo from "@/assets/kinguard-logo.png";

export function SiteNavigation() {
  const { user, profile } = useAuth();
  const { ask: askSignOut, dialog: signOutDialog } = useSignOutConfirm();
  const { t } = useI18n();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const isAdminPage = path === "/admin" || path.startsWith("/admin/");
  const links = [
    { to: user ? "/dashboard" : "/", label: "Home" },
    ...(user ? [
      ...(profile?.role === "guardian" ? [] : [
        { to: "/check", label: "Check" },
        { to: "/ssn", label: "SSN Shield" },
        { to: "/learn", label: "Learn" },
      ]),
      { to: "/profile", label: "Profile" },
    ] : []),
    { to: "/scams", label: "Common scams" },
    { to: "/for-guardians", label: "For guardians" },
    { to: "/privacy", label: "Privacy" },
    ...(isAdminPage ? [
      { to: "/admin", label: "Admin home" },
      { to: "/admin/seniors", label: "Seniors" },
      { to: "/admin/guardians", label: "Guardians" },
      { to: "/admin/messages", label: "Messages" },
      { to: "/admin/sos", label: "SOS" },
      { to: "/admin/audit", label: "Audit" },
    ] : []),
  ];

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className={`site-navigation sticky top-0 z-40 border-b ${isAdminPage ? "bg-sky" : user ? "bg-cream" : "bg-background"}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <img src={logo} alt="" className="h-10 w-10 object-contain" />
          <span className="text-xl font-extrabold text-rose">KinGuard</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user && <Button variant="secondary" className="min-h-11 bg-rose px-3 font-bold text-destructive-foreground hover:bg-rose/90" onClick={() => { setOpen(false); askSignOut(); }}>{t("Sign Out")}</Button>}
          <Button ref={menuButton} variant="outline" size="icon" className="h-12 w-12 lg:hidden" aria-label={t(open ? "Close menu" : "Open menu")} aria-expanded={open} aria-controls="site-page-menu" onClick={() => setOpen((value) => !value)}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
        <nav id="site-page-menu" aria-label={t("Main navigation")} className={`${open ? "flex" : "hidden"} w-full flex-col gap-1 overflow-y-auto lg:flex lg:flex-row lg:flex-wrap lg:gap-x-4`}>
          {links.map((link) => <Link key={link.to} to={link.to} activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary" }} className="rounded-md px-3 py-3 text-sm font-bold hover:bg-secondary focus-visible:outline focus-visible:outline-ring lg:py-2" onClick={() => setOpen(false)}>{t(link.label)}</Link>)}
        </nav>
      </div>
      {signOutDialog}
    </header>
  );
}