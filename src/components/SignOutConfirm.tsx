import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

/** Returns an ask() function and a dialog element that confirms before signing out. */
export function useSignOutConfirm(onDone?: () => void) {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const es = lang === "es";

  const dialog = open ? (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={() => setOpen(false)}
    >
      <div className="card-soft w-full max-w-sm text-center" style={{ background: "var(--color-card)" }} onClick={(e) => e.stopPropagation()}>
        <p className="font-extrabold" style={{ fontSize: 20 }}>
          {es ? "¿Está seguro de que desea cerrar sesión?" : "Are you sure you want to sign out?"}
        </p>
        <div className="flex gap-3 mt-4">
          <button type="button" className="btn-base btn-outline flex-1" onClick={() => setOpen(false)}>
            {es ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="button"
            className="btn-base btn-rose flex-1"
            onClick={async () => { setOpen(false); onDone?.(); await signOut(); navigate({ to: "/" }); }}
          >
            {es ? "Cerrar sesión" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { ask: () => setOpen(true), dialog };
}
