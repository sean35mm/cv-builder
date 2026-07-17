'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SignInForm } from '@/components/sign-in-form';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFlow?: 'signIn' | 'signUp';
}

export function AuthModal({
  open,
  onOpenChange,
  initialFlow = 'signUp',
}: AuthModalProps) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  useEffect(() => {
    if (loggedInUser) {
      onOpenChange(false);
    }
  }, [loggedInUser, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2px] border sm:max-w-md">
        <DialogHeader>
          <p className="platform-kicker text-primary">OpenCV / Access</p>
          <DialogTitle className="font-serif text-3xl font-normal tracking-[-0.02em]">Open your publishing desk</DialogTitle>
          <DialogDescription>
            Enter your email to sign in or create an account.
          </DialogDescription>
        </DialogHeader>
        <SignInForm initialFlow={initialFlow} />
      </DialogContent>
    </Dialog>
  );
}
