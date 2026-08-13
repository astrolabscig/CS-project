interface FilterPillsProps {
  label: string;
  options: string[];
  active: string | null;
  onChange: (value: string | null) => void;
}

export default function FilterPills({ label, options, active, onChange }: FilterPillsProps) {
  return (
    // Mobile: a single horizontally-scrolling, snapping row (edge-faded via
    // mask-image as the "more content" hint) — wrapping into multiple lines
    // reads as a shrunk desktop layout on a phone. sm+: reverts to the
    // original wrapping row, unchanged.
    <div
      className="flex items-center gap-2 overflow-x-auto flex-nowrap snap-x snap-proximity [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] sm:flex-wrap sm:overflow-visible sm:[mask-image:none]"
    >
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-1">
        {label}
      </span>

      <button
        type="button"
        aria-pressed={active === null}
        onClick={() => onChange(null)}
        className={`shrink-0 snap-start px-3 min-h-11 flex items-center rounded-full text-xs font-medium border transition ${
          active === null
            ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent'
            : 'bg-[var(--surface)] border-transparent shadow-[0_1px_2px_var(--shadow)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
        }`}
      >
        All
      </button>

      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={active === option}
          onClick={() => onChange(option)}
          className={`shrink-0 snap-start px-3 min-h-11 flex items-center rounded-full text-xs font-medium border transition ${
            active === option
              ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent'
              : 'bg-[var(--surface)] border-transparent shadow-[0_1px_2px_var(--shadow)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
