// Hand-coded flat-style character illustration for the landing page hero.
// Uses theme tokens only (per docs/UI-SPEC.md) so it swaps cleanly between
// light and dark instead of being a themed raster image.
export default function HeroCharacter({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 220"
      className={className}
      role="img"
      aria-labelledby="hero-character-title"
    >
      <title id="hero-character-title">Illustration of a student waving hello</title>

      <ellipse cx="80" cy="208" rx="52" ry="8" fill="var(--shadow)" />

      {/* Legs */}
      <rect x="52" y="150" width="20" height="52" rx="10" fill="var(--surface-3)" />
      <rect x="88" y="150" width="20" height="52" rx="10" fill="var(--surface-3)" />
      <rect x="48" y="196" width="28" height="12" rx="6" fill="var(--text-primary)" />
      <rect x="84" y="196" width="28" height="12" rx="6" fill="var(--text-primary)" />

      {/* Arms */}
      <path
        d="M56,112 Q40,140 46,166"
        stroke="var(--accent)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="46" cy="169" r="9" fill="var(--text-muted)" />

      <path
        d="M104,112 Q130,96 120,54"
        stroke="var(--accent)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="120" cy="51" r="10" fill="var(--text-muted)" />

      {/* Torso / hoodie */}
      <rect x="42" y="95" width="76" height="70" rx="30" fill="var(--accent)" />
      <rect x="70" y="90" width="20" height="14" rx="7" fill="var(--accent-subtle)" />

      {/* Head */}
      <circle cx="80" cy="70" r="26" fill="var(--text-muted)" />
      <ellipse cx="80" cy="50" rx="27" ry="14" fill="var(--text-primary)" />
      <circle cx="72" cy="72" r="2.2" fill="var(--text-primary)" />
      <circle cx="88" cy="72" r="2.2" fill="var(--text-primary)" />
      <path
        d="M70,82 q10,8 20,0"
        stroke="var(--text-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
