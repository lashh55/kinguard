import { useI18n } from "@/lib/i18n";

export function NeverNotice() {
  const { lang } = useI18n();
  return (
    <div className="card-soft" role="note" style={{ border: "3px solid var(--color-rose)" }}>
      <p className="font-bold" style={{ color: "var(--color-brown)" }}>
        🛡️ {lang === "es"
          ? "KinGuard nunca le llamará ni le pedirá dinero, tarjetas de regalo, contraseñas ni su número de Seguro Social. Nuestros correos solo provienen de @getkinguard.com."
          : "KinGuard will never call you, ask for money, gift cards, passwords, or your Social Security number. Our emails only come from @getkinguard.com."}
      </p>
    </div>
  );
}
