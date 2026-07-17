'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';

type ContactFormProps = {
  profileId: Id<'profiles'>;
  profileName: string;
  username?: string;
  protectedProfile?: boolean;
  hostBound?: boolean;
};

export function ContactForm({
  profileId,
  profileName,
  username,
  protectedProfile = false,
  hostBound = false,
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    senderName: '',
    senderEmail: '',
    subject: '',
    message: '',
    honeypot: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendMessage = useMutation(api.messages.sendMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.honeypot) {
      return;
    }

    if (
      !formData.senderName ||
      !formData.senderEmail ||
      !formData.subject ||
      !formData.message
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.senderEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      if (protectedProfile || hostBound) {
        const response = await fetch('/api/profile-access/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            senderName: formData.senderName,
            senderEmail: formData.senderEmail,
            subject: formData.subject,
            message: formData.message,
          }),
        });
        if (!response.ok) throw new Error('Unable to send message');
      } else {
        await sendMessage({
          profileId,
          senderName: formData.senderName,
          senderEmail: formData.senderEmail,
          subject: formData.subject,
          message: formData.message,
        });
      }

      toast.success('Message sent successfully!');
      setFormData({
        senderName: '',
        senderEmail: '',
        subject: '',
        message: '',
        honeypot: '',
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-4"
    >
      <div className="text-sm text-muted-foreground mb-4">
        Send a message to {profileName}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="senderName" className="text-sm font-medium">
            Your Name
          </label>
          <Input
            id="senderName"
            type="text"
            value={formData.senderName}
            onChange={(e) =>
              setFormData({ ...formData, senderName: e.target.value })
            }
            placeholder="John Doe"
            required
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="senderEmail" className="text-sm font-medium">
            Your Email
          </label>
          <Input
            id="senderEmail"
            type="email"
            value={formData.senderEmail}
            onChange={(e) =>
              setFormData({ ...formData, senderEmail: e.target.value })
            }
            placeholder="john@example.com"
            required
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <Input
          id="subject"
          type="text"
          value={formData.subject}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
          placeholder="Job opportunity, collaboration, etc."
          required
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          placeholder="Your message..."
          required
          rows={5}
          className="mt-1"
        />
      </div>

      <input
        type="text"
        name="honeypot"
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}
