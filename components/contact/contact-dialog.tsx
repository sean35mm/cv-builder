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
};

export function ContactDialog({ profileId, profileName }: ContactDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <MessageSquare className="w-3.5 h-3.5" />
          Contact
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Message</DialogTitle>
        </DialogHeader>
        <ContactForm profileId={profileId} profileName={profileName} />
      </DialogContent>
    </Dialog>
  );
}
