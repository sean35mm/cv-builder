'use client';

import { SignInForm } from '@/components/sign-in-form';
import { BrandLockup } from '@/components/platform/brand-lockup';

export default function LoginPage() {
  return (
    <main className="platform-page min-h-screen" data-route-landmark="authentication">
      <BrandLockup />
      <div className="platform-grid mt-20 gap-y-10 md:mt-32">
        <header className="col-span-12 md:col-span-6">
          <p className="platform-kicker text-primary">Access / Returning editor</p>
          <h1 className="platform-section-title mt-5">Return to your publishing desk.</h1>
          <p className="mt-5 max-w-md text-muted-foreground">Use a one-time email code, or your existing password.</p>
        </header>
        <section className="col-span-12 border-t pt-6 md:col-span-5 md:col-start-8" aria-label="Sign in form">
        <SignInForm />
        </section>
      </div>
    </main>
  );
}
