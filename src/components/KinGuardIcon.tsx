import shield from "@/assets/kinguard-shield.webp.asset.json";

export function KinGuardShield({ className = "" }: { className?: string }) {
  return <img src={shield.url} alt="" aria-hidden="true" width={28} height={28} className={`kinguard-inline-icon ${className}`} />;
}

export function BrandIcon({ icon }: { icon: string }) {
  return icon.includes("🛡") ? <KinGuardShield /> : <>{icon}</>;
}