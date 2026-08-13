'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShieldCheck, Upload, UserCircle } from 'lucide-react';
import { useSession } from './SessionProvider';

export default function BottomNav() {
  const pathname = usePathname();
  const { session } = useSession();

  if (!session) return null;

  // /rep is a rep's home (SessionProvider redirects them there from "/"), so
  // the Home tab should take them straight back to it.
  const items = [
    { href: session.role === 'REP' ? '/rep' : '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    ...(session.role === 'REP' ? [{ href: '/my-uploads', label: 'Uploads', icon: Upload }] : []),
    ...(session.role === 'SUPER_ADMIN' ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
    { href: '/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-2"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-stretch gap-1 bg-[var(--surface)] rounded-3xl shadow-[0_4px_16px_var(--shadow)] px-2 py-1.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = label === 'Home' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-14 rounded-2xl text-[10px] font-semibold transition-colors ${
                active
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
