'use client';

import { Unauthenticated, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AuthModal } from '@/components/auth-modal';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
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
    <div className="flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <a
        href="#landing-main"
        className="fixed left-4 top-3 z-50 -translate-y-20 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:translate-y-0"
      >
        Skip to main content
      </a>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
        <nav
          className="mx-auto flex h-16 max-w-[88rem] items-center gap-3 px-4 sm:px-6 lg:px-10"
          aria-label="Primary"
        >
          <BrandLockup className="mr-auto" />
          <div className="hidden items-center gap-6 md:flex">
            {[
              ['Directory', '/directory'],
              ['Changelog', '/changelog'],
              ['Roadmap', '/roadmap'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Unauthenticated>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuth('signIn')}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => openAuth('signUp')}
              >
                Claim your address
              </Button>
            </Unauthenticated>
            {loggedInUser && (
              <Button asChild size="sm">
                <Link href="/home">Home</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>

      <main id="landing-main" className="flex-1">
        <Hero onSignIn={() => openAuth('signUp')} />
        <Features />
        <ClosingCTA onSignIn={() => openAuth('signUp')} />
      </main>
      <Footer />

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        initialFlow={authFlow}
      />
    </div>
  );
}
