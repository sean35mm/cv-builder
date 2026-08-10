'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import {
  HomeDashboard,
  HomeWithoutProfile,
} from '@/components/home/home-dashboard';

export default function HomePage() {
  const router = useRouter();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);
  const stats = useQuery(
    api.analytics.getProfileStats,
    profile ? { days: 30 } : 'skip'
  );

  useEffect(() => {
    if (loggedInUser === null) {
      router.replace('/');
    }
  }, [loggedInUser, router]);

  if (loggedInUser === undefined || profile === undefined) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
        aria-label="Loading home dashboard"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </main>
    );
  }

  if (loggedInUser === null) return null;

  if (profile === null) {
    return <HomeWithoutProfile />;
  }

  return <HomeDashboard profile={profile} stats={stats} />;
}
