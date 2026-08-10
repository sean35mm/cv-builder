'use client';

import { useQuery } from 'convex/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar-custom';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

const workspaceRoutes = [
  '/home',
  '/editor',
  '/appearance',
  '/publish',
  '/activity',
  '/directory',
  '/theme',
  '/templates',
  '/analytics',
  '/inbox',
  '/testimonials',
  '/domains',
];

function WorkspaceShell({
  children,
  isPublicExplore,
}: {
  children: React.ReactNode;
  isPublicExplore: boolean;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const hasWorkspaceChrome = !isPublicExplore || Boolean(loggedInUser);

  return (
    <div
      className={cn(
        'group/app-shell min-h-screen bg-background font-sans',
        hasWorkspaceChrome &&
          'pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-14 md:pb-0'
      )}
      data-platform-theme="fixed"
      data-workspace-chrome={hasWorkspaceChrome}
    >
      {hasWorkspaceChrome ? <Sidebar /> : null}
      <div className="min-h-screen">{children}</div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = workspaceRoutes.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  if (!isWorkspace) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <WorkspaceShell isPublicExplore={pathname === '/directory'}>
      {children}
    </WorkspaceShell>
  );
}
