'use client';

import { Unauthenticated, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Toaster } from 'sonner';
import { AuthModal } from '@/components/auth-modal';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { ClosingCTA } from '@/components/landing/closing-cta';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authFlow, setAuthFlow] = useState<'signIn' | 'signUp'>('signUp');
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const router = useRouter();

  useEffect(() => {
    if (loggedInUser) router.replace('/editor');
  }, [loggedInUser, router]);

  const openAuth = (flow: 'signIn' | 'signUp') => {
    setAuthFlow(flow);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Unauthenticated>
        <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <nav className="flex items-center gap-6 rounded-full border bg-card px-5 py-2.5 shadow-sm">
            <span className="text-lg font-semibold font-serif">OpenCV</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuth('signIn')}
              >
                Sign In
              </Button>
              <Button size="sm" onClick={() => openAuth('signUp')}>
                Get Started
              </Button>
            </div>
          </nav>
        </header>
      </Unauthenticated>

      <main className="flex-1">
        <Hero onSignIn={() => openAuth('signUp')} />
        <Features />
        <ClosingCTA onSignIn={() => openAuth('signUp')} />
        <Footer />
      </main>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        initialFlow={authFlow}
      />
      <Toaster theme="system" />
    </div>
  );
}
