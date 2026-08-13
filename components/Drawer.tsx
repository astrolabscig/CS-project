'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Matches the drawer-scrim-out/drawer-panel-out durations below.
const EXIT_ANIMATION_MS = 180;

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // `open` flipping to false shouldn't unmount instantly — that skips the
  // close transition entirely. Stay mounted for one more tick, playing the
  // *-out animation, then actually unmount.
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRendered(false);
      return;
    }
    setClosing(true);
    const timeout = setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, EXIT_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [open, rendered]);

  // onClose is often passed as a fresh inline function on every render (e.g.
  // it wraps state resets). Routing calls through a ref keeps this effect
  // from re-running — and re-stealing focus to the first focusable element —
  // on every keystroke inside the drawer.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;

      const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className={`absolute inset-0 bg-[var(--scrim)] ${closing ? 'drawer-scrim-out' : 'drawer-scrim-in'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-t-3xl sm:rounded-3xl shadow-[0_8px_30px_var(--shadow)] p-6 ${closing ? 'drawer-panel-out' : 'drawer-panel-in'}`}
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold text-[var(--text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-3)] active:bg-[var(--surface-3)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
