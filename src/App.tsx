import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SignInForm } from './SignInForm';
import { SignOutButton } from './SignOutButton';
import { Toaster } from 'sonner';
import { ProfileEditor } from './components/profile-editor';
import { ProfileSetup } from './components/profile-setup';
import { PublicProfile } from './components/public-profile';
import { useState, useEffect } from 'react';

export default function App() {
  const [currentView, setCurrentView] = useState<'editor' | 'public'>('editor');
  const [publicUsername, setPublicUsername] = useState<string>('');

  // Check if we're viewing a public profile
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;

    // Check for /@username in path
    const pathMatch = path.match(/^\/@(.+)$/);
    if (pathMatch) {
      setPublicUsername(pathMatch[1]);
      setCurrentView('public');
      return;
    }

    // Check for ?@username in query params (from redirect)
    const searchMatch = search.match(/\?@(.+)$/);
    if (searchMatch) {
      setPublicUsername(searchMatch[1]);
      setCurrentView('public');
      return;
    }
  }, []);

  // If this is a public profile view, redirect to server-rendered version
  if (currentView === 'public' && publicUsername) {
    // For client-side navigation, we'll still show the React component
    // but add a note about the server-rendered version
    return (
      <div className='min-h-screen bg-raisin_black-100 text-bone-500'>
        <div className='max-w-4xl mx-auto py-4 px-6'>
          <div className='bg-bone-400 border border-bone-300 rounded-lg p-4 mb-6'>
            <p className='text-sm text-raisin_black-500'>
              <strong>Note:</strong> This profile is also available as a
              fast-loading, SEO-optimized page at{' '}
              <a
                href={`/@${publicUsername}`}
                className='font-medium underline hover:text-raisin_black-400'
              >
                /@{publicUsername}
              </a>
            </p>
          </div>
          <PublicProfile username={publicUsername} />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col bg-raisin_black-100 text-bone-500'>
      <header className='sticky top-0 z-10 bg-raisin_black-200/90 backdrop-blur-sm h-16 flex justify-between items-center border-b border-onyx-300 shadow-sm px-4'>
        <h2 className='text-xl font-semibold text-bone-500'>CV Builder</h2>
        <Authenticated>
          <div className='flex items-center gap-4'>
            <ViewProfileButton />
            <SignOutButton />
          </div>
        </Authenticated>
      </header>
      <main className='flex-1'>
        <Content />
      </main>
      <Toaster theme='dark' />
    </div>
  );
}

function ViewProfileButton() {
  const profile = useQuery(api.profiles.getMyProfile);

  if (!profile || !profile.isPublic) {
    return null;
  }

  return (
    <a
      href={`/@${profile.username}`}
      target='_blank'
      rel='noopener noreferrer'
      className='text-sm text-bone-400 hover:text-bone-300 font-medium transition-colors'
    >
      View Public Profile
    </a>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);

  if (loggedInUser === undefined || profile === undefined) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-bone-400'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      <Unauthenticated>
        <div className='max-w-md mx-auto mt-16 px-4'>
          <div className='text-center mb-8'>
            <h1 className='text-4xl font-bold text-bone-500 mb-4'>
              Build Your CV
            </h1>
            <p className='text-lg text-bone-700'>
              Create a beautiful, shareable CV in minutes
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {!profile ? <ProfileSetup /> : <ProfileEditor profile={profile} />}
      </Authenticated>
    </div>
  );
}
