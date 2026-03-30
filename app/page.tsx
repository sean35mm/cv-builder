'use client';

import { Unauthenticated, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Toaster } from 'sonner';
import { AuthModal } from '@/components/auth-modal';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { ClosingCTA } from '@/components/landing/closing-cta';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState } from 'react';
import Link from 'next/link';

export default function Page() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authFlow, setAuthFlow] = useState<'signIn' | 'signUp'>('signUp');
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const openAuth = (flow: 'signIn' | 'signUp') => {
    setAuthFlow(flow);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center gap-6 rounded-full border bg-card px-5 py-2.5 shadow-sm">
          <Link href="/" className="text-lg font-semibold font-serif">
            OpenCV
          </Link>
          <Link
            href="/changelog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Changelog
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Unauthenticated>
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
            </Unauthenticated>
            {loggedInUser && (
              <Link href="/editor">
                <Button size="sm">Dashboard</Button>
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Hero onSignIn={() => openAuth('signUp')} />
        <Features />
        <HowItWorks />
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
