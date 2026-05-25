import { useI18n } from "@/lib/i18n";

const EN = "KinGuard will NEVER ask for your Social Security Number. We do not collect it, store it, or transmit it — ever. If you see any field asking for your Social Security Number you are NOT on KinGuard. Leave that page immediately and report it to us at safety@getkinguard.com.";
const ES = "KinGuard NUNCA pedirá tu Número de Seguro Social. No lo recopilamos, almacenamos ni transmitimos — jamás. Si ves algún campo pidiendo tu Número de Seguro Social, NO estás en KinGuard. Sal de esa página de inmediato y repórtalo a safety@getkinguard.com.";

export function SsnDisclaimer() {
  const { lang } = useI18n();
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{ background: "#E74C3C", color: "#fff", fontSize: 15, lineHeight: 1.4 }}
      role="alert"
    >
      <span className="font-extrabold">🚨 </span>
      {lang === "es" ? ES : EN}
    </div>
  );
}
