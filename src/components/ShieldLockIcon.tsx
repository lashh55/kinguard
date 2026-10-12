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
