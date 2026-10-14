'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';

type Step = 'email' | 'code' | 'password';

type OAuthProvider = 'google' | 'linkedin';

const OAUTH_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  linkedin: 'LinkedIn',
};

// OAuth returns here with ?code=, which the auth middleware exchanges for a
// session before the page loads. If ?oauth= is still present and the visitor
// is signed out, the provider round trip failed (Convex Auth doesn't say why).
const oauthRedirect = (provider: OAuthProvider) => `/login?oauth=${provider}`;

const RESEND_COOLDOWN = 30;

const normalize = (raw: string) => raw.trim().toLowerCase();

function passwordErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('InvalidAccountId')) {
    return 'No password account uses that email. Continue with email instead.';
  }
  if (
    message.includes('InvalidSecret') ||
    message.includes('Invalid password')
  ) {
    return 'That password is incorrect.';
  }
  if (message.includes('TooManyFailedAttempts')) {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  return 'Could not sign in. Try again.';
}

function Spinner() {
  return <Loader2 className="animate-spin" aria-hidden="true" />;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" fill="#fff" />
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"
      />
    </svg>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[13px] leading-5 text-destructive">
      {message}
    </p>
  );
}

// The login page redirects once the session is live, so success here only
// keeps the form in its pending state.
export function SignInForm() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [oauthPending, setOAuthPending] = useState<OAuthProvider | null>(
    null
  );

  useEffect(() => {
    const provider = new URLSearchParams(window.location.search).get('oauth');
    if (provider !== 'google' && provider !== 'linkedin') return;
    setError(
      `Could not sign in with ${OAUTH_LABELS[provider]}. Try again, or continue with email.`
    );
    window.history.replaceState(null, '', '/login');
  }, []);

  // Back from the provider restores this page from the bfcache with the
  // spinner still showing.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setOAuthPending(null);
    };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const goTo = (next: Step) => {
    setStep(next);
    setError(null);
    setNotice('');
    setCode('');
  };

  const continueWith = async (provider: OAuthProvider) => {
    setError(null);
    setOAuthPending(provider);
    try {
      // Navigates to the provider on success.
      await signIn(provider, { redirectTo: oauthRedirect(provider) });
    } catch {
      setError(
        `Could not reach ${OAUTH_LABELS[provider]}. Try again in a moment.`
      );
      setOAuthPending(null);
    }
  };

  const sendCode = async (resend = false) => {
    const address = normalize(email);
    if (!address) {
      setError('Enter your email address.');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await signIn('email', { email: address });
      setStep('code');
      setCode('');
      setCooldown(RESEND_COOLDOWN);
      setNotice(resend ? `New code sent to ${address}.` : '');
    } catch {
      setError(
        resend
          ? 'Could not resend the code. Try again in a moment.'
          : 'Could not send a code to that address. Check it and try again.'
      );
    } finally {
      setPending(false);
    }
  };

  const verify = async (value: string) => {
    if (pending || value.length < 6) return;
    setError(null);
    setNotice('Verifying…');
    setPending(true);
    try {
      const { signingIn } = await signIn('email', {
        email: normalize(email),
        code: value,
      });
      if (!signingIn) throw new Error('Not signed in');
    } catch {
      setNotice('');
      setError('That code is invalid or has expired.');
      setCode('');
      setPending(false);
    }
  };

  const signInWithPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const rawEmail = formData.get('email');
    formData.set(
      'email',
      normalize(typeof rawEmail === 'string' ? rawEmail : '')
    );
    formData.set('flow', 'signIn');
    try {
      await signIn('password', formData);
    } catch (err) {
      setError(passwordErrorMessage(err));
      setPending(false);
    }
  };

  if (step === 'code') {
    return (
      <div key="code" className="animate-rise">
        <h1 className="font-serif text-3xl font-normal tracking-[-0.02em]">
          Check your email
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
          Enter the 6-digit code we sent to{' '}
          <span className="break-all font-medium text-foreground">
            {normalize(email)}
          </span>
          .
        </p>

        <form
          className="mt-7 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void verify(code);
          }}
        >
          <Label htmlFor="auth-code" className="sr-only">
            Verification code
          </Label>
          <InputOTP
            id="auth-code"
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={code}
            onChange={(value) => {
              setCode(value);
              if (error) setError(null);
            }}
            onComplete={(value: string) => void verify(value)}
            autoFocus
            containerClassName="w-full"
          >
            <InputOTPGroup className="w-full justify-between gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-12 w-full max-w-12"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FormError message={error} />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending || code.length < 6}
          >
            {pending ? <Spinner /> : null}
            {pending ? 'Verifying' : 'Verify'}
          </Button>
        </form>

        <p
          role="status"
          aria-live="polite"
          className="mt-3 min-h-5 text-[13px] text-subtle"
        >
          {notice}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 text-muted-foreground hover:text-foreground disabled:opacity-100 disabled:text-subtle"
            disabled={pending || cooldown > 0}
            onClick={() => void sendCode(true)}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Button>
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 text-muted-foreground hover:text-foreground"
            disabled={pending}
            onClick={() => goTo('email')}
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'password') {
    return (
      <div key="password" className="animate-rise">
        <h1 className="font-serif text-3xl font-normal tracking-[-0.02em]">
          Sign in with password
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
          For accounts created with a password. New accounts use an email code.
        </p>

        <form
          className="mt-7 space-y-4"
          onSubmit={(event) => void signInWithPassword(event)}
        >
          <div className="space-y-2">
            <Label htmlFor="password-email">Email</Label>
            <Input
              id="password-email"
              type="email"
              name="email"
              defaultValue={email}
              autoComplete="email"
              required
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-secret">Password</Label>
            <Input
              id="password-secret"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              autoFocus
              className="h-10"
            />
          </div>
          <FormError message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Spinner /> : null}
            Sign in
          </Button>
        </form>

        <Button
          type="button"
          variant="link"
          className="mt-6 h-auto px-0 text-[13px] text-muted-foreground hover:text-foreground"
          onClick={() => goTo('email')}
        >
          Use an email code instead
        </Button>
      </div>
    );
  }

  return (
    <div key="email" className="animate-rise">
      <h1 className="font-serif text-3xl font-normal tracking-[-0.02em]">
        Sign in to OpenCV
      </h1>
      <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
        New here? Any option creates your account.
      </p>

      <div className="mt-7 space-y-2.5">
        {(['google', 'linkedin'] as const).map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={pending || oauthPending !== null}
            onClick={() => void continueWith(provider)}
          >
            {oauthPending === provider ? (
              <Spinner />
            ) : provider === 'google' ? (
              <GoogleMark />
            ) : (
              <LinkedInMark />
            )}
            Continue with {OAUTH_LABELS[provider]}
          </Button>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="my-5 flex items-center gap-3 text-[12px] text-subtle"
      >
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void sendCode();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'auth-email-error' : undefined}
            className="h-10"
          />
        </div>
        <div id="auth-email-error">
          <FormError message={error} />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending || oauthPending !== null}
        >
          {pending ? <Spinner /> : null}
          Continue with email
        </Button>
      </form>

      <Button
        type="button"
        variant="link"
        className="mt-6 h-auto px-0 text-[13px] text-muted-foreground hover:text-foreground"
        onClick={() => goTo('password')}
      >
        Sign in with password
      </Button>
    </div>
  );
}
