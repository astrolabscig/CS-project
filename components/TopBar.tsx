'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Menu, Search, ShieldCheck, Upload } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import AppLogo from './AppLogo';
import { useSession } from './SessionProvider';
import type { Role } from '@/types/resource';

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Student',
  REP: 'Course Rep',
  SUPER_ADMIN: 'Super Admin',
};

const ICON_PILL =
  'w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-[0_1px_2px_var(--shadow)] hover:bg-[var(--surface-3)]';

export default function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const router = useRouter();
  const { session, signOut } = useSession();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-2 sm:gap-3 min-h-16 px-4 sm:px-6 bg-[var(--topbar-bg)]/85 backdrop-blur-md border-b border-[var(--border)] text-[var(--topbar-fg)]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`md:hidden -ml-1 ${ICON_PILL}`}
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <Link href="/" className="shrink-0" aria-label="CS Resource Hub home">
        <span className="sm:hidden">
          <AppLogo showName={false} />
        </span>
        <span className="hidden sm:inline">
          <AppLogo />
        </span>
      </Link>

      {/* Mobile: search/profile live in BottomNav instead, so just push the
          remaining controls (theme toggle, sign-in) to the right. */}
      <div className="flex-1 sm:hidden" />

      <form role="search" onSubmit={handleSearch} className="hidden sm:flex flex-1 min-w-0 justify-center px-2">
        <div className="relative w-full max-w-md">
          <label htmlFor="global-search" className="sr-only">
            Search courses and resources
          </label>
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            id="global-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, resources..."
            className="w-full h-11 pl-10 pr-4 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-[0_1px_2px_var(--shadow)] text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none"
          />
        </div>
      </form>

      {/* Role-specific controls render conditionally (design doc §3: reps and
          admins get extra controls on shared pages, not duplicate pages). */}
      {session && (session.role === 'REP' || session.role === 'SUPER_ADMIN') && (
        <Link href="/my-uploads" aria-label="My uploads" title="My uploads" className={`hidden sm:flex ${ICON_PILL}`}>
          <Upload className="w-5 h-5" />
        </Link>
      )}
      {session?.role === 'SUPER_ADMIN' && (
        <Link href="/admin" aria-label="Admin" title="Admin" className={`hidden sm:flex ${ICON_PILL}`}>
          <ShieldCheck className="w-5 h-5" />
        </Link>
      )}

      <ThemeToggle />

      {session ? (
        <>
          <Link
            href="/profile"
            className="hidden sm:flex items-center gap-2 pl-1.5 pr-4 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-[0_1px_2px_var(--shadow)] hover:bg-[var(--surface-3)] max-w-[12rem]"
          >
            <span className="w-8 h-8 shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center text-xs font-bold">
              {session.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex flex-col leading-tight text-left">
              <span className="text-xs font-semibold truncate">{session.name}</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate">
                {ROLE_LABELS[session.role]} · {session.level ? `Level ${session.level}` : 'No level yet'}
              </span>
            </span>
          </Link>

          <button type="button" onClick={signOut} aria-label="Sign out" className={`hidden sm:flex ${ICON_PILL}`}>
            <LogOut className="w-5 h-5" />
          </button>
        </>
      ) : (
        <Link
          href="/sign-in"
          className="px-4 min-h-11 flex items-center rounded-full text-sm font-semibold bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_1px_2px_var(--shadow)]"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
