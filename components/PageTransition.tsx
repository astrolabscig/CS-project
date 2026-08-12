'use client';

import { usePathname } from 'next/navigation';

// Keying by pathname forces a fresh mount (and replayed .page-transition
// animation) on every route change, so navigating always feels like a soft
// fade + rise instead of an instant content swap.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
