import { useId } from "react";

export function ShieldLockIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M32 4 L54 12 V30 C54 45 44 55 32 60 C20 55 10 45 10 30 V12 Z" fill="#F2C97D" stroke="#7A4A2E" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M25 30 V25 a7 7 0 0 1 14 0 V30" fill="none" stroke="#5A1E14" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="21" y="29" width="22" height="17" rx="3" fill="#5A1E14" />
      <circle cx="32" cy="36" r="2.6" fill="#F2C97D" />
      <rect x="31" y="37" width="2" height="5" rx="1" fill="#F2C97D" />
    </svg>
  );
}

export function GlowLines({ color, size }: { color: string; size: number }) {
  const r1 = size / 2 + 4, r2 = size / 2 + 11;
  const c = size / 2 + 12;
  const angles = [-90, -45, -135, 0, 180];
  return (
    <svg width={size + 24} height={size + 24} aria-hidden="true" className="absolute inset-0">
      {angles.map((a) => {
        const rad = (a * Math.PI) / 180;
        return <line key={a} x1={c + r1 * Math.cos(rad)} y1={c + r1 * Math.sin(rad)} x2={c + r2 * Math.cos(rad)} y2={c + r2 * Math.sin(rad)} stroke={color} strokeWidth="3" strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function GlowIcon({ color, size, children }: { color: string; size: number; children: React.ReactNode }) {
  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size + 24, height: size + 24 }}>
      <GlowLines color={color} size={size} />
      {children}
    </div>
  );
}

/** Solid red warning triangle with a white exclamation mark and four short alert lines. */
export function DangerTriangleIcon({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`}>
      <g stroke="#D9393E" strokeWidth="3.4" strokeLinecap="round">
        <line x1="25" y1="9" x2="21.5" y2="3" />
        <line x1="39" y1="9" x2="42.5" y2="3" />
        <line x1="12" y1="27" x2="5.5" y2="23.5" />
        <line x1="52" y1="27" x2="58.5" y2="23.5" />
      </g>
      <path d="M32 14 L54 50 L10 50 Z" fill="#D9393E" stroke="#D9393E" strokeWidth="6" strokeLinejoin="round" />
      <rect x="29.3" y="24" width="5.4" height="13.5" rx="2.7" fill="#fff" />
      <circle cx="32" cy="43.5" r="3" fill="#fff" />
    </svg>
  );
}

/** Solid white person silhouette with a round white badge holding a red cross or minus. */
export function PersonBadgeIcon({
  size = 36,
  mark = "x",
  className = "",
}: {
  size?: number;
  mark?: "x" | "minus";
  className?: string;
}) {
  const raw = useId();
  const id = `kg-person-${mark}-${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={`shrink-0 ${className}`}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="#fff" />
          <circle cx="35" cy="35" r="12.6" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id})`} fill="#fff">
        <circle cx="19" cy="14" r="8.6" />
        <path d="M4 42 C4 31 10.5 24.6 19 24.6 C27.5 24.6 34 31 34 42 Z" />
      </g>
      <circle cx="35" cy="35" r="11" fill="#fff" />
      {mark === "x" ? (
        <path d="M30.9 30.9 L39.1 39.1 M39.1 30.9 L30.9 39.1" stroke="#D9393E" strokeWidth="3.4" strokeLinecap="round" />
      ) : (
        <path d="M30.5 35 H39.5" stroke="#D9393E" strokeWidth="3.4" strokeLinecap="round" />
      )}
    </svg>
  );
}
