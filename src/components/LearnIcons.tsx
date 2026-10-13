import { badgeById } from "@/lib/badges";
import { LEVEL_BADGE_IMAGES, levelBadgeName, type ArtworkLevelName } from "@/lib/badgeArtwork";
import { useI18n } from "@/lib/i18n";

/** Uploaded artwork includes its own ring; do not add a decorative container. */
export function BadgeIcon({ level, size = 120 }: { level?: string | null; size?: number }) {
  const { lang } = useI18n();
  const name = (badgeById(level)?.name ?? "Just getting started") as ArtworkLevelName;
  const artwork = LEVEL_BADGE_IMAGES[name] ?? LEVEL_BADGE_IMAGES["Just getting started"];
  const label = levelBadgeName(name, lang);
  return (
    <img src={artwork.url} width={size} height={size}
      className="kg-level-badge block shrink-0 object-contain"
      alt={lang === "es" ? `Insignia ${label}` : `${label} badge`} />
  );
}
