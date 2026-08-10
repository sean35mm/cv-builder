'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { AppearanceWorkspace } from '@/components/appearance/appearance-workspace';

export default function AppearancePage() {
  const router = useRouter();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);

  useEffect(() => {
    if (loggedInUser === null || (loggedInUser && profile === null)) {
      router.replace('/');
    }
  }, [loggedInUser, profile, router]);

  if (
    loggedInUser === undefined ||
    profile === undefined ||
    loggedInUser === null ||
    profile === null
  ) {
    return (
      <main
        className="flex min-h-[400px] items-center justify-center"
        aria-busy="true"
        aria-label="Loading appearance settings"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </main>
    );
  }

  return <AppearanceWorkspace profile={profile} />;
}
