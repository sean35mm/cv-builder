'use client';
import { Unauthenticated, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Toaster } from 'sonner';

import { AuthModal } from '@/components/auth-modal';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Workflow } from '@/components/landing/workflow';
import { FAQ } from '@/components/landing/faq';
import { ClosingCTA } from '@/components/landing/closing-cta';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState } from 'react';
import { Instrument_Serif } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400' });

export default function Page() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authFlow, setAuthFlow] = useState<'signIn' | 'signUp'>('signUp');
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const router = useRouter();
  useEffect(() => {
    if (loggedInUser) router.replace('/editor');
  }, [loggedInUser, router]);

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
              <ThemeToggle />
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
  return (
    <div className="flex flex-col">
      <Hero onSignIn={onSignIn} />
      <Features />
      <Workflow />
      <FAQ />
      <ClosingCTA onSignIn={onSignIn} />
      <Footer />
    </div>
  );
}
