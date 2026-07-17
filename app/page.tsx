'use client';

import { Unauthenticated, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
import { BrandLockup } from '@/components/platform/brand-lockup';

export default function Page() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authFlow, setAuthFlow] = useState<'signIn' | 'signUp'>('signUp');
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const openAuth = (flow: 'signIn' | 'signUp') => {
    setAuthFlow(flow);
    setAuthModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-background">
        <nav className="mx-auto flex min-h-16 max-w-[90rem] items-center gap-4 px-4 sm:px-6 lg:px-16" aria-label="Primary">
          <BrandLockup className="mr-auto" />
          <div className="hidden items-center md:flex">
            {[
              ['Directory', '/directory'],
              ['Changelog', '/changelog'],
              ['Roadmap', '/roadmap'],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="flex min-h-11 items-center border-l px-4 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground">
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1 border-l pl-2">
            <ThemeToggle />
            <Unauthenticated>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuth('signIn')}
              >
                Sign in
              </Button>
              <Button size="sm" onClick={() => openAuth('signUp')}>
                Start
              </Button>
            </Unauthenticated>
            {loggedInUser && (
              <Link href="/editor">
                <Button size="sm">Open desk</Button>
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
    </div>
  );
}
