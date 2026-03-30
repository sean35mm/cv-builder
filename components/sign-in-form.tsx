'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';

type Step = 'email' | 'otp' | 'password';

interface SignInFormProps {
  initialFlow?: 'signIn' | 'signUp';
}

export function SignInForm({ initialFlow = 'signIn' }: SignInFormProps = {}) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [flow, setFlow] = useState<'signIn' | 'signUp'>(initialFlow);
  const [submitting, setSubmitting] = useState(false);

  const normalize = (raw: string) => raw.trim().toLowerCase();

  // Step 1: Send OTP code via email
  const handleSendCode = useCallback(async () => {
    const normalized = normalize(email);
    if (!normalized) {
      toast.error('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn('email', { email: normalized });
      setStep('otp');
      toast.success('Check your email for a sign-in code.');
    } catch {
      toast.error('Could not send verification email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [email, signIn]);

  // Step 2: Verify OTP code
  const handleVerifyCode = useCallback(async () => {
    const normalized = normalize(email);
    if (!code || code.length < 6) {
      toast.error('Please enter the 6-digit code.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn('email', { email: normalized, code });
    } catch {
      toast.error('Invalid or expired code. Please try again.');
      setSubmitting(false);
    }
  }, [email, code, signIn]);

  // Resend code
  const handleResend = useCallback(async () => {
    setSubmitting(true);
    try {
      await signIn('email', { email: normalize(email) });
      toast.success('New code sent to your email.');
    } catch {
      toast.error('Could not resend code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [email, signIn]);

  // Password fallback
  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const rawEmail = formData.get('email');
      formData.set(
        'email',
        normalize(typeof rawEmail === 'string' ? rawEmail : '')
      );
      formData.set('flow', flow);
      try {
        await signIn('password', formData);
      } catch (error) {
        const msg = String((error as Error)?.message || '');
        if (msg.includes('InvalidAccountId')) {
          toast.error('No account found for that email. Try signing up.');
        } else if (
          msg.includes('InvalidSecret') ||
          msg.includes('Invalid password')
        ) {
          toast.error('Incorrect password. Please try again.');
        } else if (msg.includes('TooManyFailedAttempts')) {
          toast.error(
            'Too many failed attempts. Please wait and try again.'
          );
        } else {
          toast.error(
            flow === 'signIn'
              ? 'Could not sign in. Please try again.'
              : 'Could not sign up. Please try again.'
          );
        }
        setSubmitting(false);
      }
    },
    [flow, signIn]
  );

  // ─── Email step (default) ───────────────────────────────────
  if (step === 'email') {
    return (
      <div className="w-full space-y-4">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendCode();
          }}
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="Email"
            required
          />
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Continue with email
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              or
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setStep('password')}
        >
          Use password instead
        </Button>
      </div>
    );
  }

  // ─── OTP verification step ──────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="w-full space-y-5">
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">We sent a code to</p>
          <p className="text-sm font-medium">{email}</p>
        </div>

        <form
          className="flex flex-col items-center gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleVerifyCode();
          }}
        >
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            disabled={submitting || code.length < 6}
            className="w-full"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Verify'
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            disabled={submitting}
            onClick={() => void handleResend()}
          >
            Resend
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full gap-1"
          onClick={() => {
            setStep('email');
            setCode('');
          }}
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
      </div>
    );
  }

  // ─── Password fallback step ─────────────────────────────────
  return (
    <div className="w-full space-y-4">
      <form className="flex flex-col gap-3" onSubmit={handlePasswordSubmit}>
        <Input
          type="email"
          name="email"
          defaultValue={email}
          autoComplete="email"
          placeholder="Email"
          required
        />
        <Input
          type="password"
          name="password"
          autoComplete={
            flow === 'signUp' ? 'new-password' : 'current-password'
          }
          placeholder="Password"
          required
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : flow === 'signIn' ? (
            'Sign in'
          ) : (
            'Sign up'
          )}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          <span>
            {flow === 'signIn'
              ? "Don't have an account? "
              : 'Already have an account? '}
          </span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
          >
            {flow === 'signIn' ? 'Sign up instead' : 'Sign in instead'}
          </Button>
        </div>
      </form>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full gap-1"
        onClick={() => setStep('email')}
      >
        <ArrowLeft className="h-3 w-3" />
        Back to email sign in
      </Button>
    </div>
  );
}
