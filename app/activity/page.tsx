'use client';

import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import {
  ActivityLoading,
  ActivityNoProfile,
  ActivityOverview,
} from '@/components/activity/activity-overview';

export default function ActivityPage() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);
  const router = useRouter();

  useEffect(() => {
    if (loggedInUser === null) {
      router.replace('/');
    }
  }, [loggedInUser, router]);

  if (loggedInUser === undefined || profile === undefined) {
    return <ActivityLoading />;
  }

  if (loggedInUser === null) return null;
  if (!profile) return <ActivityNoProfile />;

  return <ActivityOverview />;
}
