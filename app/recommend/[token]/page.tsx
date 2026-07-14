'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Check, Star } from 'lucide-react';

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
      toast.error('Failed to submit testimonial');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestInfo === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requestInfo === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Invalid or expired request link
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please ask for a new testimonial request
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">
              Your testimonial for {requestInfo.profileName} has been submitted
              and is pending their approval.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold font-serif mb-2">
            Write a Recommendation
          </h1>
          <p className="text-muted-foreground">
            Share your experience working with {requestInfo.profileName}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Testimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="authorName">Your Name *</Label>
                  <Input
                    id="authorName"
                    value={formData.authorName}
                    onChange={(e) =>
                      setFormData({ ...formData, authorName: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
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
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="authorTitle">Your Title</Label>
                  <Input
                    id="authorTitle"
                    value={formData.authorTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, authorTitle: e.target.value })
                    }
                    placeholder="Senior Engineer"
                    className="mt-1"
                  />
                </div>
                <div>
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
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
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
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1"
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

              <div>
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
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
