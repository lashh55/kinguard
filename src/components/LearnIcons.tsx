import { badgeById } from "@/lib/badges";
import { LEVEL_BADGE_IMAGES, levelBadgeName, type ArtworkLevelName } from "@/lib/badgeArtwork";
import { useI18n } from "@/lib/i18n";

/** Filled, full-color inline SVG icons for the Learn page. Same drawing on every device. */
type P = { size?: number; className?: string };
const svg = (size: number, vb: string, className: string, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox={vb} aria-hidden="true" className={`shrink-0 ${className}`}>{children}</svg>
);

export function Leaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C2 -10 10 -16 20 -16 C20 -6 12 2 0 0 Z" fill="#3E9B4F" />
      <path d="M0 0 C6 -5 12 -10 18 -14" stroke="#1F6B35" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function CalendarSproutIcon({ size = 32, className = "" }: P) {
  return svg(size, "0 0 48 48", className, <>
    <rect x="6" y="9" width="32" height="30" rx="5" fill="#F6EFD8" stroke="#2E7D46" strokeWidth="3" />
    <path d="M6 14 a5 5 0 0 1 5 -5 h22 a5 5 0 0 1 5 5 v4 H6 Z" fill="#2E7D46" />
    <rect x="13" y="5" width="3.5" height="8" rx="1.7" fill="#C9A23F" />
    <rect x="27.5" y="5" width="3.5" height="8" rx="1.7" fill="#C9A23F" />
    {[0, 1, 2].map((c) => [0, 1].map((r) => <rect key={`${c}${r}`} x={11 + c * 8} y={22 + r * 7} width="5" height="4.5" rx="1" fill="#B5CC9A" />))}
    <path d="M33 46 V34" stroke="#2E7D46" strokeWidth="2.4" strokeLinecap="round" />
    <Leaf x={33} y={36} s={0.75} r={-10} />
    <Leaf x={33} y={39} s={0.6} r={200} />
  </>);
}

export function ClapperIcon({ size = 64, className = "" }: P) {
  return svg(size, "0 0 64 64", className, <>
    <g transform="rotate(-18 12 22)">
      <rect x="10" y="12" width="40" height="10" rx="2" fill="#0F4A2E" stroke="#C9A23F" strokeWidth="2" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${16 + i * 9} 12 l5 10 h4 l-5 -10 Z`} fill="#E3C46E" />)}
    </g>
    <rect x="10" y="24" width="40" height="28" rx="4" fill="#0F4A2E" stroke="#C9A23F" strokeWidth="2.4" />
    <path d="M25 31 L38 38 L25 45 Z" fill="#fff" />
    <Leaf x={42} y={58} s={1.1} r={-35} />
  </>);
}

export function GradCapIcon({ size = 36, className = "" }: P) {
  return svg(size, "0 0 48 48", className, <>
    <path d="M12 22 V32 C12 36 36 36 36 32 V22 Z" fill="#0F4A2E" />
    <path d="M2 18 L24 8 L46 18 L24 28 Z" fill="#1A6B40" stroke="#0F4A2E" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M24 18 L40 22 V36" stroke="#D4AE6A" strokeWidth="2" fill="none" strokeLinecap="round" />
    <rect x="38" y="35" width="4" height="8" rx="1.5" fill="#D4AE6A" />
  </>);
}

export function LaptopBlueIcon({ size = 40, className = "" }: P) {
  return svg(size, "0 0 48 48", className, <>
    <rect x="7" y="9" width="34" height="23" rx="3" fill="#3A4652" />
    <rect x="10" y="12" width="28" height="17" rx="1.5" fill="#2F7DE1" />
    <path d="M15 17 h12 M15 21 h18 M15 25 h9" stroke="#CFE3FF" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 34 H45 L42 39 H6 Z" fill="#8C99A6" />
  </>);
}

export function GrandparentsIcon({ size = 40, className = "" }: P) {
  return svg(size, "0 0 48 48", className, <>
    {/* grandmother */}
    <path d="M24 44 C24 34 28 29 34 29 C40 29 44 34 44 44 Z" fill="#C98A8A" />
    <circle cx="34" cy="20" r="8" fill="#F2C9A8" />
    <path d="M26 19 C26 11 42 11 42 19 C40 15 30 14 26 19 Z" fill="#D9D9DE" />
    <circle cx="34" cy="10" r="3.5" fill="#D9D9DE" />
    {/* grandfather */}
    <path d="M4 44 C4 34 8 29 15 29 C22 29 26 34 26 44 Z" fill="#7F97AD" />
    <circle cx="15" cy="20" r="8" fill="#F2C9A8" />
    <path d="M7 18 C8 12 22 12 23 18 C20 15 10 15 7 18 Z" fill="#C8C8CE" />
    <circle cx="12" cy="21" r="2.6" fill="none" stroke="#3D2B2B" strokeWidth="1.4" />
    <circle cx="18" cy="21" r="2.6" fill="none" stroke="#3D2B2B" strokeWidth="1.4" />
    <path d="M14.6 21 h0.8" stroke="#3D2B2B" strokeWidth="1.4" />
  </>);
}

export function MedicalFormIcon({ size = 40, className = "" }: P) {
  return svg(size, "0 0 48 48", className, <>
    <rect x="7" y="4" width="28" height="38" rx="3" fill="#EEF2F7" stroke="#C7D0DB" strokeWidth="1.5" />
    <path d="M7 7 a3 3 0 0 1 3 -3 h22 a3 3 0 0 1 3 3 v4 H7 Z" fill="#2B5D8C" />
    <path d="M16 15 v10 M11 20 h10" stroke="#2B6FB8" strokeWidth="3.4" strokeLinecap="round" />
    <path d="M24 17 h7 M24 23 h7 M12 31 h18 M12 36 h12" stroke="#B4BFCC" strokeWidth="2" strokeLinecap="round" />
    <path d="M37 26 L46 29 V35 C46 40 42 44 37 46 C32 44 28 40 28 35 V29 Z" fill="#D9393E" />
    <rect x="35.8" y="30" width="2.4" height="8" rx="1.2" fill="#fff" />
    <circle cx="37" cy="41" r="1.5" fill="#fff" />
  </>);
}

export function CoupleHeartIcon({ size = 40, className = "" }: P) {
  return svg(size, "0 0 48 48", className, <>
    <defs>
      <linearGradient id="kg-heart-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F59AB5" /><stop offset="1" stopColor="#D9393E" />
      </linearGradient>
    </defs>
    <path d="M24 44 C10 34 2 26 2 16 C2 9 7 4 13.5 4 C18 4 22 7 24 11 C26 7 30 4 34.5 4 C41 4 46 9 46 16 C46 26 38 34 24 44 Z" fill="url(#kg-heart-grad)" />
    <circle cx="16" cy="17" r="4" fill="#fff" />
    <path d="M9 32 C9 25 12 22 16 22 C19 22 21 24 22 27 L22 34 Z" fill="#fff" />
    <circle cx="32" cy="17" r="4" fill="#fff" />
    <path d="M39 32 C39 25 36 22 32 22 C29 22 27 24 26 27 L26 34 Z" fill="#fff" />
  </>);
}

export function SproutSoilIcon({ size = 40, className = "" }: P) {
  return svg(size, "0 0 64 64", className, <>
    <ellipse cx="32" cy="56" rx="20" ry="4" fill="#3D2B2B" opacity="0.15" />
    <path d="M12 56 C14 46 22 42 32 42 C42 42 50 46 52 56 Z" fill="#7A4E2E" />
    <circle cx="22" cy="49" r="1.6" fill="#5A3820" /><circle cx="36" cy="47" r="1.4" fill="#5A3820" /><circle cx="43" cy="52" r="1.5" fill="#5A3820" />
    <path d="M32 44 V26" stroke="#3E9B4F" strokeWidth="3.4" strokeLinecap="round" />
    <path d="M32 28 C26 16 14 16 8 20 C12 30 24 32 32 28 Z" fill="#4CAF50" />
    <path d="M32 28 C38 14 50 12 57 16 C53 28 40 32 32 28 Z" fill="#5FBF5F" />
    <path d="M32 28 C24 24 16 21 10 20 M32 28 C40 22 48 18 55 16" stroke="#2E7D46" strokeWidth="1.2" fill="none" />
  </>);
}

export function CheckRingIcon({ size = 44, className = "" }: P) {
  return svg(size, "0 0 48 48", className, <>
    <circle cx="24" cy="24" r="20" fill="none" stroke="#D4AE6A" strokeWidth="5" />
    <path d="M24 4 A20 20 0 1 0 44 24" fill="none" stroke="#2E7D46" strokeWidth="5" />
    <circle cx="24" cy="24" r="12" fill="#3E9B4F" />
    <path d="M18.5 24 L22.5 28 L30 20" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>);
}

export function TargetIcon({ size = 44, className = "" }: P) {
  return svg(size, "0 0 48 48", className, <>
    <circle cx="22" cy="26" r="19" fill="#2E7D46" />
    <circle cx="22" cy="26" r="13.5" fill="#F6EFD8" />
    <circle cx="22" cy="26" r="9" fill="#C9A23F" />
    <circle cx="22" cy="26" r="4" fill="#F6EFD8" />
    <path d="M22 26 L40 8" stroke="#0F4A2E" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M37 5 L45 3 L43 11 Z" fill="#7BAE3F" />
  </>);
}

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
