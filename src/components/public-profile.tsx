import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ProfilePreview } from './profile-preview';

interface PublicProfileProps {
  username: string;
}

export function PublicProfile({ username }: PublicProfileProps) {
  const profile = useQuery(api.profiles.getProfileByUsername, { username });

  if (profile === undefined) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-raisin_black-100'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-bone-400'></div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-raisin_black-100'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-bone-500 mb-2'>
            Profile Not Found
          </h1>
          <p className='text-bone-700'>
            The profile you're looking for doesn't exist or is not public.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-raisin_black-100'>
      <div className='w-[90%] mx-auto py-12 px-6'>
        <ProfilePreview profile={profile} />
      </div>
    </div>
  );
}
