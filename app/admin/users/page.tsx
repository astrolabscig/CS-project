'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AdminPageShell from '@/components/AdminPageShell';
import Drawer from '@/components/Drawer';
import { useLibrary } from '@/components/LibraryProvider';
import { useRequireRole } from '@/components/SessionProvider';
import { useToast } from '@/components/ToastProvider';
import type { Level, MockUser, Role } from '@/types/resource';

const LEVELS: Level[] = [100, 200, 300, 400];
const ROLES: Role[] = ['STUDENT', 'REP', 'SUPER_ADMIN'];
const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Student',
  REP: 'Course Rep',
  SUPER_ADMIN: 'Super Admin',
};

function AddStudentForm({ onDone }: { onDone: () => void }) {
  const { addStudent } = useLibrary();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isValid = email.trim().length > 0 && /^\d{7}$/.test(indexNumber.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || submitting) return;

    setSubmitting(true);
    const result = await addStudent({ email: email.trim(), indexNumber: indexNumber.trim() });
    setSubmitting(false);
    if (!result.ok) {
      toast(result.error, 'error');
      return;
    }
    toast(result.levelNotice ? `Student added. ${result.levelNotice}` : 'Student added.');
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="new-student-email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Email
        </label>
        <input
          id="new-student-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. jbafful5@gmail.com"
          className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)]"
        />
      </div>
      <div>
        <label htmlFor="new-student-index" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Index number
        </label>
        <input
          id="new-student-index"
          type="text"
          inputMode="numeric"
          maxLength={7}
          value={indexNumber}
          onChange={(e) => setIndexNumber(e.target.value)}
          placeholder="e.g. 8412621"
          className="w-full h-11 px-3 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder-[var(--text-subtle)] text-sm outline-none focus:border-[var(--focus)] tabular-nums"
        />
      </div>
      {touched && !isValid && (
        <p className="text-xs text-[var(--text-muted)]">
          Enter an email and a 7-digit index number. The student&apos;s level is computed
          automatically.
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full min-h-11 px-4 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-semibold disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add student'}
      </button>
    </form>
  );
}

export default function AdminUsersPage() {
  const { permitted } = useRequireRole(['SUPER_ADMIN']);
  const { users, updateUser } = useLibrary();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);

  if (!permitted) return null;

  const handleUpdate = async (
    user: MockUser,
    patch: Partial<Pick<MockUser, 'role' | 'level' | 'status'>> & { recalculateLevel?: boolean },
    message: string
  ) => {
    const result = await updateUser(user, patch);
    if (result.ok) toast(message);
    else toast(result.error, 'error');
  };

  return (
    <AdminPageShell>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Manage users / reps</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Grant rep role, assign a level scope, or deactivate an account. Deactivating never
            removes their uploads.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="shrink-0 flex items-center gap-1.5 min-h-11 px-3.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-[var(--accent-fg)]"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Add student
        </button>
      </div>

      <div className="mt-5 space-y-2.5">
        {users.map((user) => {
          const inactive = user.status === 'INACTIVE';
          return (
            <div
              key={user.email}
              className={`bg-[var(--surface)] rounded-2xl p-5 shadow-[0_1px_3px_var(--shadow)] transition-shadow duration-200 hover:shadow-[0_1px_3px_var(--shadow),0_10px_24px_-6px_var(--shadow)] ${
                inactive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                  {inactive && (
                    <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-subtle)]">
                      Inactive
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(
                      user,
                      { status: inactive ? 'ACTIVE' : 'INACTIVE' },
                      inactive ? `Reactivated ${user.name}.` : `Deactivated ${user.name}.`
                    )
                  }
                  className="shrink-0 min-h-11 sm:min-h-9 px-3 rounded-full text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]"
                >
                  {inactive ? 'Reactivate' : 'Deactivate'}
                </button>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap border-t border-[var(--border)] pt-3">
                <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  Role
                  <select
                    value={user.role}
                    disabled={inactive}
                    onChange={(e) =>
                      handleUpdate(
                        user,
                        { role: e.target.value as Role },
                        `${user.name} is now ${ROLE_LABELS[e.target.value as Role]}.`
                      )
                    }
                    className="h-11 sm:h-9 px-2 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-xs outline-none focus:border-[var(--focus)] disabled:opacity-60"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  Level
                  <select
                    value={user.level ?? ''}
                    disabled={inactive}
                    onChange={(e) =>
                      handleUpdate(
                        user,
                        { level: Number(e.target.value) as Level },
                        `${user.name} moved to Level ${e.target.value}.`
                      )
                    }
                    className="h-11 sm:h-9 px-2 rounded-xl bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] text-xs outline-none focus:border-[var(--focus)] disabled:opacity-60"
                  >
                    {user.level === null && (
                      <option value="" disabled>
                        Not set
                      </option>
                    )}
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>

                {user.role === 'STUDENT' && user.indexNumber && (
                  <button
                    type="button"
                    disabled={inactive}
                    onClick={() =>
                      handleUpdate(user, { recalculateLevel: true }, `Recalculated ${user.name}'s level.`)
                    }
                    className="min-h-11 sm:min-h-9 px-3 rounded-full text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-3)] disabled:opacity-60"
                  >
                    Recalculate level
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="Add student">
        <AddStudentForm onDone={() => setAddOpen(false)} />
      </Drawer>
    </AdminPageShell>
  );
}
