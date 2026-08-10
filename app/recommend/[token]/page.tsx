'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, Loader2, Check, Star } from 'lucide-react';
import { BrandLockup } from '@/components/platform/brand-lockup';

export default function RecommendPage() {
  const params = useParams();
  const token = params.token as string;

  const [formData, setFormData] = useState({
    authorName: '',
    authorEmail: '',
    authorTitle: '',
    authorCompany: '',
    relationship: '',
    content: '',
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requestInfo = useQuery(api.testimonials.getTestimonialByToken, {
    token,
  });
  const submitTestimonial = useMutation(api.testimonials.submitTestimonial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.authorName ||
      !formData.authorEmail ||
      !formData.relationship ||
      !formData.content
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitTestimonial({
        token,
        authorName: formData.authorName,
        authorEmail: formData.authorEmail,
        authorTitle: formData.authorTitle || undefined,
        authorCompany: formData.authorCompany || undefined,
        relationship: formData.relationship,
        content: formData.content,
        rating: formData.rating || undefined,
      });

      setSubmitted(true);
      toast.success('Testimonial submitted successfully!');
    } catch {
      setSubmitError('Failed to submit testimonial');
      toast.error('Failed to submit testimonial');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestInfo === undefined) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-background p-6"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading recommendation request…
        </div>
      </main>
    );
  }

  if (requestInfo === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md border-y border-border py-10 text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <h1 className="mt-4 font-display text-xl font-semibold">
              Invalid or expired request link
            </h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Please ask for a new testimonial request
          </p>
        </section>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section
          className="w-full max-w-md border-y border-border py-12 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="mb-2 font-display text-xl font-semibold">
            Thank You!
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your testimonial for {requestInfo.profileName} has been submitted
            and is pending their approval.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <BrandLockup compact />
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <div className="mb-8 border-b border-border pb-8 sm:pb-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            A note for {requestInfo.profileName}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Write a Recommendation
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Share your experience working with {requestInfo.profileName}
          </p>
        </div>

        <section className="border-y border-border py-8 sm:py-10">
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">
            Your Testimonial
          </h2>
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="mt-7 space-y-7"
            aria-describedby={submitError ? 'submit-error' : undefined}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authorName">Your Name *</Label>
                <Input
                  id="authorName"
                  value={formData.authorName}
                  onChange={(e) =>
                    setFormData({ ...formData, authorName: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorEmail">Your Email *</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  value={formData.authorEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, authorEmail: e.target.value })
                  }
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authorTitle">Your Title</Label>
                <Input
                  id="authorTitle"
                  value={formData.authorTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, authorTitle: e.target.value })
                  }
                  placeholder="Senior Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorCompany">Company</Label>
                <Input
                  id="authorCompany"
                  value={formData.authorCompany}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      authorCompany: e.target.value,
                    })
                  }
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Your Relationship *</Label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({ ...formData, relationship: e.target.value })
                }
                placeholder="e.g., Manager, Colleague, Client"
                required
                className="mt-1"
              />
            </div>

            <fieldset>
              <legend className="text-sm font-medium leading-none">
                Rating (Optional)
              </legend>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="min-h-11 min-w-11 rounded p-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Rate ${star} out of 5 stars`}
                    aria-pressed={formData.rating === star}
                    title={`Rate ${star} out of 5 stars`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= formData.rating
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="content">Your Recommendation *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Share your experience working with them..."
                required
                rows={6}
              />
            </div>

            {submitError && (
              <p
                id="submit-error"
                role="alert"
                className="border border-border bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Testimonial'
              )}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
