import { useI18n } from "@/lib/i18n";

export const guardianDisclaimer = {
  en: "Choose your guardians carefully, especially if they are not a family member. Only add people you know and trust. Guardians can see your KinGuard alerts. They cannot see or access your bank, retirement, or any other financial accounts through KinGuard. You can remove a guardian at any time. KinGuard does not screen or supervise guardians and is not responsible for what a guardian does. If you think someone is taking advantage of you, contact Adult Protective Services or call 911.",
  es: "Elija a sus guardianes con cuidado, especialmente si no son familiares. Solo agregue a personas que conozca y en quienes confíe. Sus guardianes pueden ver sus alertas de KinGuard. No pueden ver ni acceder a sus cuentas bancarias, de jubilación ni a ninguna otra cuenta financiera a través de KinGuard. Puede quitar a un guardián en cualquier momento. KinGuard no evalúa ni supervisa a los guardianes y no es responsable de lo que haga un guardián. Si cree que alguien se está aprovechando de usted, comuníquese con los Servicios de Protección para Adultos o llame al 911.",
};

export function GuardianDisclaimer() {
  const { lang } = useI18n();
  return <p className="leading-relaxed">{guardianDisclaimer[lang === "es" ? "es" : "en"]}</p>;
}