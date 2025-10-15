'use client';
import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Toaster } from 'sonner';
import { ProfileEditor } from '@/components/profile-editor';
import { ProfileSetup } from '@/components/profile-setup';
import { AuthModal } from '@/components/auth-modal';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Workflow } from '@/components/landing/workflow';
import { Gallery } from '@/components/landing/gallery';
import { FAQ } from '@/components/landing/faq';
import { ClosingCTA } from '@/components/landing/closing-cta';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Instrument_Serif } from 'next/font/google';
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400' });

export default function Page() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authFlow, setAuthFlow] = useState<'signIn' | 'signUp'>('signUp');

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Unauthenticated>
        <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="backdrop-blur-md bg-card/70 border rounded-full px-6 py-3 flex items-center gap-8 shadow-lg">
            <div
              className={`text-lg font-semibold ${instrumentSerif.className}`}
            >
              OpenCV
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAuthFlow('signIn');
                  setAuthModalOpen(true);
                }}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setAuthFlow('signUp');
                  setAuthModalOpen(true);
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </header>
      </Unauthenticated>

      <main className="flex-1">
        <Content
          onSignIn={() => {
            setAuthFlow('signUp');
            setAuthModalOpen(true);
          }}
        />
      </main>
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        initialFlow={authFlow}
      />
      <Toaster theme="light" />
    </div>
  );
}

// function ViewProfileButton() {
//   const profile = useQuery(api.profiles.getMyProfile);
//   if (!profile || !profile.isPublic) return null;
//   return (
//     <a
//       href={`/@${profile.username}`}
//       target="_blank"
//       rel="noopener noreferrer"
//       className="text-sm text-primary hover:text-primary font-medium transition-colors"
//     >
//       View Public Profile
//     </a>
//   );
// }

function Content({ onSignIn }: { onSignIn: () => void }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);

  if (loggedInUser === undefined || profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Unauthenticated>
        <Hero onSignIn={onSignIn} />
        <Features />
        <Workflow />
        <Gallery />
        <FAQ />
        <ClosingCTA onSignIn={onSignIn} />
        <Footer />
      </Unauthenticated>

      <Authenticated>
        {!profile ? <ProfileSetup /> : <ProfileEditor profile={profile} />}
      </Authenticated>
    </div>
  );
}
