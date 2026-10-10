import { useI18n } from "@/lib/i18n";
import { KinGuardShield } from "@/components/KinGuardIcon";

export function NeverNotice() {
  const { lang } = useI18n();
  return (
    <div className="card-soft" role="note" style={{ border: "3px solid var(--color-rose)" }}>
      <p className="font-bold" style={{ color: "var(--color-brown)" }}>
        <KinGuardShield /> {lang === "es"
          ? "KinGuard nunca le llamará ni le pedirá dinero, tarjetas de regalo ni contraseñas. Nuestros correos solo provienen de @getkinguard.com."
          : "KinGuard will never call you or ask for money, gift cards, or passwords. Our emails only come from @getkinguard.com."}
      </p>
    </div>
  );
}
