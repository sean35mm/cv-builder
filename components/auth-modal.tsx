'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SignInForm } from '@/components/sign-in-form';

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFlow?: 'signIn' | 'signUp';
};

export function AuthModal({
  open,
  onOpenChange,
  initialFlow = 'signUp',
}: AuthModalProps) {
  const router = useRouter();
  const loggedInUser = useQuery(api.auth.loggedInUser);

  useEffect(() => {
    if (open && loggedInUser) {
      router.replace('/home');
      onOpenChange(false);
    }
  }, [loggedInUser, onOpenChange, open, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 sm:max-w-md">
        <DialogHeader className="pr-8">
          <div className="mb-2 size-2.5 bg-accent" />
          <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.02em]">
            Sign in to OpenCV
          </DialogTitle>
          <DialogDescription className="leading-6">
            One account for your profile, messages, and analytics.
          </DialogDescription>
        </DialogHeader>
        <SignInForm initialFlow={initialFlow} />
      </DialogContent>
    </Dialog>
  );
}
