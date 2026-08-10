'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { ContactForm } from '@/components/contact/contact-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ContactDialogProps = {
  profileId: Id<'profiles'>;
  profileName: string;
  username?: string;
  protectedProfile?: boolean;
  hostBound?: boolean;
};

export function ContactDialog({
  profileId,
  profileName,
  username,
  protectedProfile,
  hostBound,
}: ContactDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex min-h-11 items-center gap-1.5 rounded px-3 text-xs text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground">
          <MessageSquare className="size-3.5" />
          Contact
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Message</DialogTitle>
        </DialogHeader>
        <ContactForm
          profileId={profileId}
          profileName={profileName}
          username={username}
          protectedProfile={protectedProfile}
          hostBound={hostBound}
        />
      </DialogContent>
    </Dialog>
  );
}
