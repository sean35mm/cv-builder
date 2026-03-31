'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar-custom';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicProfile =
    pathname?.startsWith('/u/') || pathname?.startsWith('/@');
  const isPublicPage =
    pathname === '/' ||
    pathname === '/changelog' ||
    pathname === '/roadmap' ||
    pathname === '/terms' ||
    pathname === '/privacy';

  const myProfile = useQuery(api.profiles.getMyProfile);
  const colorTheme = myProfile?.colorTheme ?? 'sage';
  const shouldApplyTheme = !(isPublicProfile || isPublicPage);

  useEffect(() => {
    const root = document.documentElement;
    const removeThemeClasses = () => {
      const toRemove: string[] = [];
      root.classList.forEach((cls) => {
        if (cls.startsWith('theme-')) toRemove.push(cls);
      });
      if (toRemove.length) root.classList.remove(...toRemove);
    };

    removeThemeClasses();
    if (shouldApplyTheme) {
      root.classList.add(`theme-${colorTheme}`);
    }
    return () => {
      removeThemeClasses();
    };
  }, [colorTheme, shouldApplyTheme]);

  if (!shouldApplyTheme) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-background md:pl-[72px] pb-16 md:pb-0">
      <Sidebar />
      <div className="flex-1 min-h-screen">{children}</div>
    </div>
  );
}
