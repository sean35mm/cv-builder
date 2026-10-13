'use client';

import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Onboarding } from '@/components/onboarding/onboarding';
import { Workspace } from '@/components/workspace/workspace';
import { WorkspaceSkeleton } from '@/components/workspace/workspace-skeleton';
import { api } from '@/convex/_generated/api';

export default function EditorPage() {
  const router = useRouter();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(
    api.profiles.getMyProfile,
    loggedInUser ? {} : 'skip'
  );

  useEffect(() => {
    if (loggedInUser === null) router.replace('/login');
  }, [loggedInUser, router]);

  if (!loggedInUser || profile === undefined) return <WorkspaceSkeleton />;
  if (profile === null) return <Onboarding />;

  return (
    <Workspace key={profile._id} profile={profile} email={loggedInUser.email} />
  );
}
