'use client';

import Link from 'next/link';
import { LogOut, Mail, Hash, GraduationCap, ShieldCheck, Upload } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { useSession } from '@/components/SessionProvider';
import type { Role } from '@/types/resource';

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Student',
  REP: 'Course Rep',
  SUPER_ADMIN: 'Super Admin',
};


export default function ProfilePage() {
  const { session, signOut } = useSession();

  // SessionProvider redirects to /sign-in before this page can render
  // without a session, but guard for TypeScript's benefit.
  if (!session) return null;

  return (
    <PageShell>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Profile</h1>

      <div className="mt-4 bg-[var(--surface)] rounded-3xl p-6 shadow-[0_2px_8px_var(--shadow)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center font-bold text-lg">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[var(--text-primary)] truncate">
              {session.name}
            </p>
            <span className="mt-0.5 inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)]">
              {ROLE_LABELS[session.role]}
            </span>
          </div>
        </div>

        <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
            <dt className="sr-only">Email</dt>
            <dd className="text-sm text-[var(--text-primary)] truncate">{session.email}</dd>
          </div>
          <div className="flex items-center gap-3">
            <GraduationCap className="w-4 h-4 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
            <dt className="sr-only">Level</dt>
            <dd className="text-sm text-[var(--text-primary)]">
              {session.level ? `Level ${session.level}` : 'Not yet assigned'}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
            <dt className="sr-only">Index number</dt>
            <dd className="text-sm text-[var(--text-primary)] tabular-nums">
              {session.indexNumber || 'Not set'}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
            <dt className="sr-only">Role</dt>
            <dd className="text-sm text-[var(--text-primary)]">{ROLE_LABELS[session.role]}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={signOut}
          className="mt-5 w-full flex items-center justify-center gap-2 min-h-11 px-4 rounded-full bg-[var(--surface-2)] border border-transparent text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sign out
        </button>
      </div>

      {(session.role === 'REP' || session.role === 'SUPER_ADMIN') && (
        <nav aria-label="Role tools" className="mt-6">
          <ul className="space-y-2">
            <li>
              <Link
                href="/my-uploads"
                className="flex items-center gap-3 min-h-11 px-4 rounded-2xl bg-[var(--surface)] shadow-[0_1px_3px_var(--shadow)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
              >
                <Upload className="w-4 h-4 text-[var(--text-subtle)]" aria-hidden="true" />
                My uploads
              </Link>
            </li>
            {session.role === 'SUPER_ADMIN' && (
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 min-h-11 px-4 rounded-2xl bg-[var(--surface)] shadow-[0_1px_3px_var(--shadow)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
                >
                  <ShieldCheck className="w-4 h-4 text-[var(--text-subtle)]" aria-hidden="true" />
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}

    </PageShell>
  );
}
