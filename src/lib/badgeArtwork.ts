import sprout from "@/assets/badges/badge-1-sprout.png.asset.json";
import seedling from "@/assets/badges/badge-2-seedling.png.asset.json";
import youngPlant from "@/assets/badges/badge-3-young-plant.png.asset.json";
import sapling from "@/assets/badges/badge-4-sapling.png.asset.json";
import fullTree from "@/assets/badges/badge-5-full-tree.png.asset.json";

/** Change only the image for a level here when its replacement artwork arrives. */
export const LEVEL_BADGE_IMAGES = {
  "Just getting started": sprout,
  "Scam Aware": seedling,
  "Scam Spotter": youngPlant,
  "Scam Defender": sapling,
  "Scam Fighter": fullTree,
  "Scam Guardian": fullTree, // Temporary
  "Scam Champion": fullTree, // Temporary
  "KinGuard Legend": fullTree, // Temporary
} as const;

export type ArtworkLevelName = keyof typeof LEVEL_BADGE_IMAGES;

const SPANISH_NAMES: Record<ArtworkLevelName, string> = {
  "Just getting started": "Apenas comenzando",
  "Scam Aware": "Consciente de las estafas",
  "Scam Spotter": "Detector de estafas",
  "Scam Defender": "Defensor contra estafas",
  "Scam Fighter": "Luchador contra estafas",
  "Scam Guardian": "Guardián contra estafas",
  "Scam Champion": "Campeón contra estafas",
  "KinGuard Legend": "Leyenda de KinGuard",
};

export function levelBadgeName(name: ArtworkLevelName, lang: string) {
  return lang === "es" ? SPANISH_NAMES[name] : name;
}