'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to OpenCV</DialogTitle>
        </DialogHeader>
        <SignInForm initialFlow={initialFlow} />
      </DialogContent>
    </Dialog>
  );
}
