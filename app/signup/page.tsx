'use client';

import { SignInForm } from '@/components/sign-in-form';
import { BrandLockup } from '@/components/platform/brand-lockup';

export default function SignupPage() {
  return (
    <main className="platform-page min-h-screen" data-route-landmark="authentication">
      <BrandLockup />
      <div className="platform-grid mt-20 gap-y-10 md:mt-32">
        <header className="col-span-12 md:col-span-6">
          <p className="platform-kicker text-primary">Access / New folio</p>
          <h1 className="platform-section-title mt-5">Begin with the work you already have.</h1>
          <p className="mt-5 max-w-md text-muted-foreground">Create an account by email. You can set the public address after you arrive.</p>
        </header>
        <section className="col-span-12 border-t pt-6 md:col-span-5 md:col-start-8" aria-label="Create account form">
        <SignInForm initialFlow="signUp" />
        </section>
      </div>
    </main>
  );
}
