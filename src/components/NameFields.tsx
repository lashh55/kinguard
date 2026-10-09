import { useI18n } from "@/lib/i18n";

/** Letters (incl. accents), spaces, hyphens, apostrophes. */
export const FIRST_NAME_RE = /^[\p{L}][\p{L} '’-]*$/u;

export function cleanFirstName(v: string) {
  return v.replace(/[^\p{L} '’-]/gu, "").slice(0, 30);
}
export function cleanInitial(v: string) {
  const m = v.match(/\p{L}/u);
  return m ? m[0].toUpperCase() : "";
}
/** Display format: "Mary J." */
export function formatName(first: string, initial: string) {
  return `${first.trim().replace(/\s+/g, " ")} ${initial.toUpperCase()}.`;
}
export function isValidName(first: string, initial: string) {
  const f = first.trim();
  return f.length > 0 && f.length <= 30 && FIRST_NAME_RE.test(f) && /^\p{L}$/u.test(initial);
}

export function NameFields({
  first, initial, onFirst, onInitial,
}: { first: string; initial: string; onFirst: (v: string) => void; onInitial: (v: string) => void }) {
  const { lang } = useI18n();
  const es = lang === "es";
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="block font-bold mb-1">{es ? "Nombre" : "First name"}</span>
        <input
          className="input-large" required maxLength={30} autoComplete="given-name"
          placeholder={es ? "María José" : "Mary"}
          value={first} onChange={(e) => onFirst(cleanFirstName(e.target.value))}
        />
      </label>
      <label className="block">
        <span className="block font-bold mb-1">{es ? "Primera letra de su apellido" : "First letter of your last name"}</span>
        <input
          className="input-large" required maxLength={1} autoComplete="off" style={{ maxWidth: 120, textTransform: "uppercase" }}
          placeholder={es ? "G" : "J"}
          value={initial} onChange={(e) => onInitial(cleanInitial(e.target.value))}
        />
      </label>
      <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
        {es
          ? "Para proteger su privacidad, solo pedimos su nombre y la inicial de su apellido."
          : "For your privacy, we only ask for your first name and last initial."}
      </p>
    </div>
  );
}
