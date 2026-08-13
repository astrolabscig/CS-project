'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Inbox, LayoutGrid, ShieldAlert, Users } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/requests', label: 'Requests', icon: Inbox },
  { href: '/admin/resources', label: 'Resources', icon: ShieldAlert },
];

// Desktop-only static admin nav (distinct from Sidebar.tsx, which is the
// dynamic Level/Semester/Course browser). Mobile admins reach every section
// via the Overview page's own link list plus BottomNav's Admin tab, so no
// mobile drawer is built here.
export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    // Stretched to the full height of the content row by the parent's
    // items-stretch, so it never scrolls away with <main> (only <main>
    // scrolls — see AdminPageShell).
    <aside className="hidden md:flex md:h-auto shrink-0 md:my-4 md:ml-4 w-[220px] md:rounded-2xl bg-[var(--surface)] md:border md:border-[var(--border)] shadow-[0_4px_16px_var(--shadow)] flex-col">
      <p className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
        Admin
      </p>
      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-2.5 pb-4 pt-2 space-y-1">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2.5 min-h-11 md:min-h-10 px-4 rounded-full text-sm font-medium ${
                active ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
