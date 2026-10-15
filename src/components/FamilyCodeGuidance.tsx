import { useI18n } from "@/lib/i18n";

export function FamilyCodeDefinition() {
  const { t } = useI18n();
  return <p className="mt-1">{t("A short, private phrase that only you and your real loved ones know. KinGuard creates a unique one for you. Never use a code word you've seen anywhere else.")}</p>;
}

export function FamilyCodeGuidance() {
  const { lang } = useI18n();
  return (
    <div className="space-y-3">
      <p>{lang === "es"
        ? "Su palabra clave familiar comprueba que alguien realmente es de su familia. Si alguien dice ser familiar, por teléfono, mensaje de texto, correo electrónico o en su puerta, pídale que diga su palabra clave. Nunca la diga usted primero. Si no puede decirla, no comparta nada con esa persona."
        : "Your family code word proves someone is really family. If anyone claims to be family, by phone, text, email, or at your door, ask them to say your code word. Never say it first. If they can't say it, don't share anything with them."}</p>
      <p>{lang === "es"
        ? "Si alguien dice ser de su banco, del gobierno o de una empresa, no use su palabra clave. Cuelgue y llame al número que aparece en su tarjeta o factura."
        : "If someone claims to be from your bank, the government, or a company, don't use your code word. Hang up and call the number on your card or bill."}</p>
    </div>
  );
}

export function FamilyCodeWarning() {
  const { lang } = useI18n();
  return <p className="font-bold mt-3">{lang === "es"
    ? "Solo comparta su palabra clave con familiares de confianza, por teléfono o en persona — nunca por mensaje de texto ni por correo electrónico."
    : "Only share your code word with family you trust, by phone or in person — never by text or email."}</p>;
}