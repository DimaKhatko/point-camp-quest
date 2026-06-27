export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm-p" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.55 0.22 300)" />
          <stop offset="100%" stopColor="oklch(0.36 0.18 295)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lm-p)" />
      <circle cx="20" cy="25" r="7" fill="oklch(0.86 0.13 175)" />
      <path d="M20 7 L31 22 L9 22 Z" fill="oklch(0.90 0.18 95)" />
    </svg>
  );
}
