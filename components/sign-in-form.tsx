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
        We&apos;ll email you a 6-digit code. New here? The same code creates
        your account.
      </p>

      <form
        className="mt-7 space-y-4"
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
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
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
