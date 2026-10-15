import { NeverNotice } from "@/components/NeverNotice";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ScreenShell } from "@/components/ScreenShell";
import { GuardianDisclaimer } from "@/components/GuardianDisclaimer";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy & Safety — KinGuard" },
      { name: "description", content: "How KinGuard protects your data and what we never collect." },
      { property: "og:title", content: "Privacy & Safety — KinGuard" },
      { property: "og:description", content: "How KinGuard protects your data and what we never collect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PrivacyPage() {
  const { lang, t } = useI18n();
  const es = lang === "es";
  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3">
        <h1>🔒 {es ? "Privacidad y seguridad" : "Privacy & Safety"}</h1>
      </header>

      <section className="px-5 mb-3"><NeverNotice /></section>
      {/* SSN Banner */}
      <section className="px-5">
        <div className="rounded-2xl p-4 text-center" style={{ background: "#E74C3C", color: "#fff", fontSize: 15 }}>
          <p className="font-extrabold mb-1" style={{ fontSize: 17 }}>🚨 {es ? "KinGuard NUNCA pedirá su Número de Seguro Social" : "KinGuard will NEVER ask for your Social Security Number"}</p>
          <p>{es ? "No lo recopilamos, almacenamos ni transmitimos — jamás. Si ve algún campo pidiendo su Número de Seguro Social, NO está en KinGuard. Salga de esa página de inmediato y repórtelo a " : "We do not collect it, store it, or transmit it — ever. If you see any field asking for your Social Security Number you are NOT on KinGuard. Leave that page immediately and report it to us at "}<span className="underline">safety@getkinguard.com</span>.</p>
        </div>
      </section>

      <Section title={t("What We Collect")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="rounded-2xl p-4" style={{ background: "color-mix(in oklab, #2ECC71 18%, #fff)" }}>
            <p className="font-extrabold mb-2" style={{ color: "#1f7a45" }}>{t("What We DO Collect")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("First name and last initial")}</li>
              <li>{t("Email address")}</li>
              <li>{t("Encrypted password")}</li>
              <li>{t("Role (Senior or Guardian)")}</li>
              <li>{t("Messages submitted for scam analysis")}</li>
              <li>{t("Scam alert history")}</li>
              <li>{t("SSN Shield checklist progress (no SSN)")}</li>
              <li>{t("Quiz scores and badge progress")}</li>
              <li>{t("Guardian relationships")}</li>
            </ul>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "color-mix(in oklab, #E74C3C 14%, #fff)" }}>
            <p className="font-extrabold mb-2" style={{ color: "#a02c20" }}>{t("What We NEVER Collect")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("Social Security Number")}</li>
              <li>{t("Bank account numbers")}</li>
              <li>{t("Credit card information")}</li>
              <li>{t("Medicare or Medicaid number")}</li>
              <li>{t("Date of birth")}</li>
              <li>{t("Home address")}</li>
              <li>{t("Government ID numbers")}</li>
              <li>{t("Location or GPS data")}</li>
              <li>{t("Phone numbers")}</li>
              <li>{t("Contacts or call history")}</li>
              <li>{t("Financial account information")}</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title={t("How We Use Your Information")} bg="#ACD0DC">
        <p>{t("We use your data only to:")}</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>{t("Analyze messages for scam threats")}</li>
          <li>{t("Connect you with your guardians")}</li>
          <li>{t("Send real-time alerts to guardians")}</li>
          <li>{t("Track quiz and badge progress")}</li>
          <li>{t("Improve the app anonymously")}</li>
        </ul>
        <p className="mt-2 font-bold">{t("We do not sell, share, or use your data for advertising. Ever.")}</p>
      </Section>

      <Section title={t("How Data Is Stored")} bg="#F6EFC1">
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("Passwords encrypted, never plain text")}</li>
          <li>{t("All data transmitted over HTTPS")}</li>
          <li>{t("Your data is locked to your account only — no other user can see it")}</li>
          <li>{t("Guardians see only what you permit")}</li>
          <li>{t("Submitted messages not shared externally")}</li>
        </ul>
      </Section>

      <Section title={t("Guardian System & Trust")} bg="#DFC18F">
        <div className="mb-4"><GuardianDisclaimer /></div>
        <ul className="list-disc pl-5 space-y-1">
          <li>{es ? "Máximo de 3 guardianes por adulto mayor" : "Maximum 3 guardians per senior"}</li>
          <li>{t("Only the senior can invite guardians")}</li>
          <li>{t("Senior can remove any guardian anytime")}</li>
          <li>{t("Guardians cannot change senior settings")}</li>
          <li>{t("Each alert shows scam type and score only")}</li>
        </ul>
      </Section>

      <section id="get-help" aria-labelledby="get-help-heading" className="px-5 py-5 mt-5 scroll-mt-28 bg-sky text-foreground">
        <h2 id="get-help-heading" className="mb-3">{es ? "Si alguien se está aprovechando de usted" : "If someone is taking advantage of you"}</h2>
        <p className="leading-relaxed">
          {es
            ? "Si alguien, incluso una persona de confianza, le está presionando por dinero, tomando su dinero o haciéndole sentir inseguro/a, usted no está solo/a y no es su culpa. Comuníquese con los Servicios de Protección para Adultos de su área. Para encontrarlos, visite "
            : "If anyone, including someone you trust, is pressuring you for money, taking your money, or making you feel unsafe, you are not alone and it is not your fault. Contact Adult Protective Services in your area. To find them, visit "}
          <a href="https://eldercare.acl.gov" className="font-bold underline break-words">eldercare.acl.gov</a>
          {es ? " o llame al Localizador de Cuidado para Personas Mayores al " : " or call the Eldercare Locator at "}
          <a href="tel:18006771116" className="font-bold underline whitespace-nowrap">1-800-677-1116</a>.
          {es ? " Si está en peligro ahora mismo, llame al " : " If you are in danger right now, call "}
          <a href="tel:911" className="font-bold underline">911</a>.
          {es ? " También puede quitar a cualquier guardián desde su Perfil en cualquier momento." : " You can also remove any guardian from your Profile at any time."}
        </p>
      </section>

      <Section title={es ? "Revisor de estafas" : "Scam Checker"} bg="#ACD0DC">
        <p className="mb-2">{es ? "KinGuard lo revisa por usted y le dice con palabras sencillas si es una estafa." : "KinGuard checks it for you and tells you in plain words if it's a scam."}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("Messages analyzed without personal info")}</li>
          <li>{t("Text content only — no attachments")}</li>
          <li>{t("Anthropic does not train on submissions")}</li>
          <li>{t("Never include passwords or SSNs in submitted messages")}</li>
        </ul>
      </Section>

      <Section title={t("Your Rights")} bg="#F6EFC1">
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("Access your data anytime")}</li>
          <li>{t("Correct name and email in settings")}</li>
          <li>{t("Delete your account from your Profile screen")}</li>
          <li>{t("Remove any guardian anytime")}</li>
          <li>{t("Opt out of non-essential communications")}</li>
        </ul>
        <p className="mt-2">{t("Contact:")} <span className="font-bold">privacy@getkinguard.com</span></p>
      </Section>

      <Section title={t("Children")} bg="#F5E6E5">
        <p>{t("KinGuard is for adults 18 and older only. Contact")} <span className="font-bold">safety@getkinguard.com</span> {t("to report underage accounts.")}</p>
      </Section>

      <Section title={t("Contact")} bg="#B27F7C" color="#fff">
        <p>privacy@getkinguard.com</p>
        <p>safety@getkinguard.com</p>
        <p className="mt-2 font-bold">empowerment4ai | empowerment4life LLC</p>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.8)" }}>{t("Last updated: May 2026")}</p>
      </Section>

      <div className="px-5 mt-6 mb-4">
        <Button asChild variant="link" className="mb-3"><Link to="/terms">{t("Terms of Service")}</Link></Button>
        <Link to="/profile" className="btn-base btn-outline w-full">{t("← Back to profile")}</Link>
      </div>
    </ScreenShell>
  );
}

function Section({ title, children, bg, color }: { title: string; children: React.ReactNode; bg?: string; color?: string }) {
  return (
    <section className="px-5 mt-5">
      <h2 className="mb-2">{title}</h2>
      <div className="card-soft" style={{ background: bg, color: color }}>{children}</div>
    </section>
  );
}