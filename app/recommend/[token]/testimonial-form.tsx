'use client';

import { useMutation, useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';

// Tokens are nanoid(16). Anything else can't match, and the backend rejects
// tokens over 64 characters by throwing, so don't ask it.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const FIELDS = [
  {
    name: 'authorName',
    label: 'Your name',
    maxLength: 120,
    required: true,
    autoComplete: 'name',
  },
  {
    name: 'authorEmail',
    label: 'Your email',
    maxLength: 254,
    required: true,
    type: 'email',
    autoComplete: 'email',
  },
  {
    name: 'authorTitle',
    label: 'Your title',
    maxLength: 160,
    autoComplete: 'organization-title',
  },
  {
    name: 'authorCompany',
    label: 'Company',
    maxLength: 160,
    autoComplete: 'organization',
  },
  {
    name: 'relationship',
    label: 'How you know them',
    maxLength: 160,
    required: true,
    placeholder: 'Manager, teammate, client…',
    autoComplete: 'off',
  },
] as const;

const value = (data: FormData, name: string) => {
  const entry = data.get(name);
  return typeof entry === 'string' ? entry.trim() : '';
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-background px-5">
      <div className="w-full max-w-[480px] flex-1 py-12 sm:py-20">
        <Brand className="mb-10" />
        {children}
      </div>
    </main>
  );
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Shell>
      <section role="status">
        <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
          {children}
        </p>
      </section>
    </Shell>
  );
}

export function TestimonialForm({ token }: { token: string }) {
  const validToken = TOKEN_PATTERN.test(token);
  const request = useQuery(
    api.testimonials.getTestimonialByToken,
    validToken ? { token } : 'skip'
  );
  const submit = useMutation(api.testimonials.submitTestimonial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Submitting spends the token, so the query turns null; remember who it
  // was for.
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return (
      <Message title="Thanks, it's sent">
        {sentTo} will see your testimonial and can choose to add it to their
        profile.
      </Message>
    );
  }

  if (validToken && request === undefined) {
    return (
      <Shell>
        <p
          className="flex items-center gap-2 text-[13px] text-muted-foreground"
          role="status"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading…
        </p>
      </Shell>
    );
  }

  if (!request) {
    return (
      <Message title="This link doesn't work anymore">
        Request links expire after 7 days and work once. Ask the person who sent
        it for a new one.
      </Message>
    );
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await submit({
        token,
        authorName: value(data, 'authorName'),
        authorEmail: value(data, 'authorEmail'),
        authorTitle: value(data, 'authorTitle') || undefined,
        authorCompany: value(data, 'authorCompany') || undefined,
        relationship: value(data, 'relationship'),
        content: value(data, 'content'),
      });
      setSentTo(request.profileName);
    } catch {
      const message =
        "Couldn't send your testimonial. The link may have expired. Try again, or ask for a new link.";
      setError(message);
      toast.error("Couldn't send your testimonial");
    } finally {
      setPending(false);
    }
  };

  return (
    <Shell>
      <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
        Write a testimonial for {request.profileName}
      </h1>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
        A few honest sentences about working together. {request.profileName}{' '}
        reviews it before it appears on their profile.
      </p>

      <form
        onSubmit={(event) => void onSubmit(event)}
        className="mt-8 space-y-4"
        aria-describedby={error ? 'testimonial-error' : undefined}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {!('required' in field) && (
                  <span className="font-normal text-subtle"> (optional)</span>
                )}
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type={'type' in field ? field.type : 'text'}
                maxLength={field.maxLength}
                required={'required' in field}
                placeholder={'placeholder' in field ? field.placeholder : ''}
                autoComplete={field.autoComplete}
              />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content">Testimonial</Label>
          <Textarea
            id="content"
            name="content"
            required
            maxLength={3000}
            rows={6}
            className="min-h-32"
          />
        </div>

        <p className="text-[12.5px] leading-5 text-subtle">
          If approved, everything except your email is shown on their profile.
          Only {request.profileName} sees your email. See our{' '}
          <Link
            href="/privacy"
            className="underline decoration-border-strong underline-offset-2 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>

        {error && (
          <p
            id="testimonial-error"
            role="alert"
            className="text-[13px] leading-5 text-destructive"
          >
            {error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Send testimonial
        </Button>
      </form>
    </Shell>
  );
}
