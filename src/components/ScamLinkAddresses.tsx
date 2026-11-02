import type { ScamLink } from "@/lib/scamEmailRules";
import { useI18n } from "@/lib/i18n";

export function ScamLinkAddresses({ links }: { links?: ScamLink[] | null }) {
  const { lang } = useI18n();
  if (!links?.length) return null;
  return <section className="space-y-3 text-foreground" aria-label={lang === "es" ? "Direcciones web reales" : "Real web addresses"}>
    <h3 className="text-xl font-bold">{lang === "es" ? "Direcciones web reales" : "Real web addresses"}</h3>
    {links.map((link) => <div key={link.address} className="space-y-1">
      <p className="text-xl font-bold [overflow-wrap:anywhere] whitespace-pre-wrap">{link.address}</p>
      {link.government_warning && <p className="text-lg font-bold text-foreground">{lang === "es"
        ? "⚠️ Dice ser del gobierno, pero la dirección real no termina en .gov. Eso es una señal de advertencia."
        : "⚠️ Claims to be from the government, but the real address does not end in .gov. That is a warning sign."}</p>}
    </div>)}
  </section>;
}