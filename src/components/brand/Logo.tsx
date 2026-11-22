import { siteConfig } from "@/config/site";

/** Nexora mark: a constellation shaped like an "N" inside an orbit. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="nx-g" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7cc4ff" />
          <stop offset="0.5" stopColor="#b98bff" />
          <stop offset="1" stopColor="#ff6b8b" />
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="16" rx="14" ry="6.5" transform="rotate(-30 16 16)" stroke="url(#nx-g)" strokeOpacity="0.45" strokeWidth="1" />
      <path d="M9 23 V9 L23 23 V9" stroke="url(#nx-g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="23" r="2.4" fill="#7cc4ff" />
      <circle cx="9" cy="9" r="2" fill="#a9b8ff" />
      <circle cx="23" cy="23" r="2" fill="#d58bff" />
      <circle cx="23" cy="9" r="2.4" fill="#ff8aa6" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={22} />
      <span className="font-display text-[15px] font-semibold tracking-[0.18em] uppercase">{siteConfig.name}</span>
    </span>
  );
}
