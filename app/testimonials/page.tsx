'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  Copy,
  Star,
  Clock,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TestimonialsPage() {
  const router = useRouter();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const testimonials = useQuery(api.testimonials.getTestimonials);
  const createRequest = useMutation(api.testimonials.createTestimonialRequest);
  const approveTestimonial = useMutation(api.testimonials.approveTestimonial);
  const rejectTestimonial = useMutation(api.testimonials.rejectTestimonial);
  const deleteTestimonial = useMutation(api.testimonials.deleteTestimonial);

  if (testimonials === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingTestimonials = testimonials.filter(
    (t) => !t.isApproved && t.content
  );
  const approvedTestimonials = testimonials.filter((t) => t.isApproved);
  const pendingRequests = testimonials.filter(
    (t) => !t.content && t.requestToken
  );

  const handleCreateRequest = async () => {
    try {
      const result = await createRequest({});
      const url = `${window.location.origin}/recommend/${result.token}`;
      await navigator.clipboard.writeText(url);
      setCopiedToken(result.token);
      toast.success('Request link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to create request');
    }
  };

  const handleApprove = async (testimonialId: string) => {
    try {
      await approveTestimonial({ testimonialId: testimonialId as any });
      toast.success('Testimonial approved');
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (testimonialId: string) => {
    try {
      await rejectTestimonial({ testimonialId: testimonialId as any });
      toast.success('Testimonial rejected');
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const handleDelete = async (testimonialId: string) => {
    try {
      await deleteTestimonial({ testimonialId: testimonialId as any });
      toast.success('Testimonial deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/editor')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold font-serif">
                Testimonials
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage recommendations from colleagues
              </p>
            </div>
          </div>
          <Button onClick={handleCreateRequest}>
            <Copy className="h-4 w-4 mr-2" />
            Request Testimonial
          </Button>
        </div>

        {pendingRequests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Pending Requests ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have {pendingRequests.length} pending testimonial request
                {pendingRequests.length !== 1 ? 's' : ''}. Share the link with
                colleagues to collect recommendations.
              </p>
            </CardContent>
          </Card>
        )}

        {pendingTestimonials.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Pending Approval</h2>
            <div className="space-y-4">
              {pendingTestimonials.map((testimonial) => (
                <Card key={testimonial._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {testimonial.authorName}
                          </span>
                          {testimonial.authorTitle && (
                            <span className="text-muted-foreground">
                              ({testimonial.authorTitle}
                              {testimonial.authorCompany &&
                                ` at ${testimonial.authorCompany}`}
                              )
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          {testimonial.relationship}
                        </div>
                        {testimonial.rating && (
                          <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (testimonial.rating ?? 0)
                                    ? 'fill-primary text-primary'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-foreground whitespace-pre-wrap">
                          {testimonial.content}
                        </p>
                        <div className="text-xs text-muted-foreground mt-3">
                          Submitted{' '}
                          {formatDistanceToNow(testimonial.createdAt, {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(testimonial._id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(testimonial._id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {approvedTestimonials.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Approved ({approvedTestimonials.length})
            </h2>
            <div className="space-y-4">
              {approvedTestimonials.map((testimonial) => (
                <Card key={testimonial._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {testimonial.authorName}
                          </span>
                          {testimonial.authorTitle && (
                            <span className="text-muted-foreground">
                              ({testimonial.authorTitle}
                              {testimonial.authorCompany &&
                                ` at ${testimonial.authorCompany}`}
                              )
                            </span>
                          )}
                          <Badge variant="secondary" className="ml-2">
                            Approved
                          </Badge>
                        </div>
                        {testimonial.rating && (
                          <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (testimonial.rating ?? 0)
                                    ? 'fill-primary text-primary'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-foreground/80 whitespace-pre-wrap">
                          {testimonial.content}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(testimonial._id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {testimonials.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No testimonials yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Request recommendations from colleagues and clients
              </p>
              <Button className="mt-4" onClick={handleCreateRequest}>
                <Copy className="h-4 w-4 mr-2" />
                Request Testimonial
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
