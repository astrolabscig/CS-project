'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Deferred to a microtask so setState isn't called synchronously within
    // the effect body — the inline theme script has already set the DOM
    // attribute before hydration, this just mirrors it into React state.
    queueMicrotask(() => {
      const current = document.documentElement.dataset.theme;
      setTheme(current === 'dark' ? 'dark' : 'light');
      setMounted(true);
    });
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-[var(--surface)] shadow-[0_1px_2px_var(--shadow)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]"
      >
        <span className="w-5 h-5" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-[var(--surface)] shadow-[0_1px_2px_var(--shadow)] text-[var(--text-muted)] hover:bg-[var(--surface-3)] motion-safe:transition-colors motion-safe:duration-150"
    >
      <Sun
        aria-hidden="true"
        className={`absolute w-5 h-5 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
      />
      <Moon
        aria-hidden="true"
        className={`absolute w-5 h-5 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out ${
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
    </button>
  );
}
