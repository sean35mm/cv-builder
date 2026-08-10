'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import {
  PublishLoading,
  PublishWithoutProfile,
  PublishWorkspace,
} from '@/components/publish/publish-workspace';

export default function PublishPage() {
  const router = useRouter();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);

  useEffect(() => {
    if (loggedInUser === null) {
      router.replace('/');
    }
  }, [loggedInUser, router]);

  if (loggedInUser === undefined || profile === undefined) {
    return <PublishLoading />;
  }

  if (loggedInUser === null) return null;
  if (profile === null) return <PublishWithoutProfile />;

  return <PublishWorkspace profile={profile} />;
}
