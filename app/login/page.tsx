'use client';

import { useConvexAuth } from 'convex/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Brand } from '@/components/brand';
import { SignInForm } from '@/components/sign-in-form';

const legalLink =
  'underline decoration-border-strong underline-offset-2 transition-colors duration-150 ease-out hover:text-foreground';

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();

  // Fires for visitors who are already signed in and after a successful
  // sign-in, once the session is live.
  useEffect(() => {
    if (isAuthenticated) router.replace('/editor');
  }, [isAuthenticated, router]);

  const ready = !isLoading && !isAuthenticated;

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background px-5">
      <div className="flex w-full max-w-[360px] flex-1 flex-col justify-center py-16">
        <Brand className="mb-10 animate-rise self-start" />
        <div aria-busy={!ready}>{ready ? <SignInForm /> : null}</div>
      </div>
      <p className="max-w-[360px] pb-8 text-center text-[12.5px] leading-5 text-subtle">
        By continuing you agree to the{' '}
        <Link href="/terms" className={legalLink}>
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className={legalLink}>
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
