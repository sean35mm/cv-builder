'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProfileEditor } from '@/components/profile-editor';
import { ProfileSetup } from '@/components/profile-setup';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EditorPage() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);
  const router = useRouter();

  useEffect(() => {
    if (loggedInUser === null) {
      router.replace('/');
    }
  }, [loggedInUser, router]);

  if (loggedInUser === undefined || profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </div>
    );
  }

  if (loggedInUser === null) return null;

  return !profile ? <ProfileSetup /> : <ProfileEditor profile={profile} />;
}
