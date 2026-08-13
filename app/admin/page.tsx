'use client';

import Link from 'next/link';
import { BookOpen, Inbox, ShieldAlert, Users } from 'lucide-react';
import AdminPageShell from '@/components/AdminPageShell';
import StatCard from '@/components/StatCard';
import TimetableManagerCard from '@/components/TimetableManagerCard';
import { useLibrary } from '@/components/LibraryProvider';
import { useRequireRole } from '@/components/SessionProvider';
import { ALL_LEVELS } from '@/lib/access';

const ADMIN_SECTIONS = [
  { href: '/admin/courses', label: 'Manage courses', icon: BookOpen },
  { href: '/admin/users', label: 'Manage users / reps', icon: Users },
  { href: '/admin/requests', label: 'Material requests inbox', icon: Inbox },
  { href: '/admin/resources', label: 'Moderate resources', icon: ShieldAlert },
];

export default function AdminOverviewPage() {
  const { permitted } = useRequireRole(['SUPER_ADMIN']);
  const { courses, resources, users, requests } = useLibrary();

  if (!permitted) return null;

  const activeResources = resources.filter((r) => r.status === 'ACTIVE').length;
  const openRequests = requests.filter((r) => r.status === 'OPEN').length;
  const students = users.filter((u) => u.role === 'STUDENT').length;
  const reps = users.filter((u) => u.role === 'REP').length;

  return (
    <AdminPageShell>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Admin</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Department overview for super-admins.
      </p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Courses" value={courses.length} />
        <StatCard label="Resources" value={activeResources} />
        <StatCard label="Users" value={users.length} />
        <StatCard label="Students" value={students} />
        <StatCard label="Reps" value={reps} />
        <StatCard label="Open requests" value={openRequests} />
      </div>

      <TimetableManagerCard levels={ALL_LEVELS} />

      {/* Desktop navigation lives in AdminSidebar; this list is the only way
          to reach admin sub-pages on mobile, where the sidebar is hidden. */}
      <ul className="mt-6 space-y-2 md:hidden">
        {ADMIN_SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="flex items-center gap-3 min-h-11 px-4 rounded-2xl bg-[var(--surface)] shadow-[0_1px_3px_var(--shadow)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
            >
              <section.icon className="w-4 h-4 text-[var(--text-subtle)]" aria-hidden="true" />
              {section.label}
            </Link>
          </li>
        ))}
      </ul>
    </AdminPageShell>
  );
}
