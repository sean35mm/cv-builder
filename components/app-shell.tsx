'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar-custom';

const workspaceRoutes = [
  '/editor',
  '/theme',
  '/templates',
  '/analytics',
  '/inbox',
  '/testimonials',
  '/domains',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = workspaceRoutes.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  if (!isWorkspace) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div
      className="min-h-screen bg-background pb-16 md:pl-60 md:pb-0"
      data-platform-theme="fixed"
    >
      <Sidebar />
      <div className="min-h-screen">{children}</div>
    </div>
  );
}
