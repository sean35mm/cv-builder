'use client';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className='w-full'>
      <form
        className='flex flex-col gap-3'
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const emailValue = formData.get('email');
          const rawEmail = typeof emailValue === 'string' ? emailValue : '';
          formData.set('email', rawEmail.trim().toLowerCase());
          formData.set('flow', flow);
          void signIn('password', formData).catch((error) => {
            const msg = String(error?.message || '');
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
          });
        }}
      >
        <input
          className='auth-input-field'
          type='email'
          name='email'
          autoComplete='email'
          placeholder='Email'
          required
        />
        <input
          className='auth-input-field'
          type='password'
          name='password'
          autoComplete={flow === 'signUp' ? 'new-password' : 'current-password'}
          placeholder='Password'
          required
        />
        <button className='auth-button' type='submit' disabled={submitting}>
          {flow === 'signIn' ? 'Sign in' : 'Sign up'}
        </button>
        <div className='text-center text-sm text-secondary'>
          <span>
            {flow === 'signIn'
              ? "Don't have an account? "
              : 'Already have an account? '}
          </span>
          <button
            type='button'
            className='text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer'
            onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
          >
            {flow === 'signIn' ? 'Sign up instead' : 'Sign in instead'}
          </button>
        </div>
      </form>
    </div>
  );
}
