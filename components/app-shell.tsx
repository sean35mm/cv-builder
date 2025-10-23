'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar-custom';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicProfile =
    pathname?.startsWith('/u/') || pathname?.startsWith('/@');
  const isLanding = pathname === '/';

  if (isPublicProfile || isLanding) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen md:pl-[75px]">
      <Sidebar />
      <div className="flex-1 min-h-screen">{children}</div>
    </div>
  );
}
