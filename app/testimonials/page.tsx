'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Check,
  X,
  Copy,
  Star,
  Clock,
  Trash2,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';
import { isTestimonialRequestExpired } from '@/convex/testimonialExpiry';
import { PageHeading } from '@/components/platform/page-heading';

export default function TestimonialsPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [currentTime] = useState(Date.now);

  const testimonials = useQuery(api.testimonials.getTestimonials);
  const createRequest = useMutation(api.testimonials.createTestimonialRequest);
  const approveTestimonial = useMutation(api.testimonials.approveTestimonial);
  const rejectTestimonial = useMutation(api.testimonials.rejectTestimonial);
  const deleteTestimonial = useMutation(api.testimonials.deleteTestimonial);
  const revokeRequest = useMutation(api.testimonials.revokeTestimonialRequest);

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
    } catch {
      toast.error('Failed to create request');
    }
  };

  const handleApprove = async (testimonialId: Id<'testimonials'>) => {
    try {
      await approveTestimonial({ testimonialId });
      toast.success('Testimonial approved');
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (testimonialId: Id<'testimonials'>) => {
    try {
      await rejectTestimonial({ testimonialId });
      toast.success('Testimonial rejected');
    } catch {
      toast.error('Failed to reject');
    }
  };

  const handleDelete = async (testimonialId: Id<'testimonials'>) => {
    try {
      await deleteTestimonial({ testimonialId });
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCopyRequest = async (token: string) => {
    try {
      const url = `${window.location.origin}/recommend/${token}`;
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      toast.success('Request link copied to clipboard!');
    } catch {
      toast.error('Failed to copy request link');
    }
  };

  const handleRevokeRequest = async (testimonialId: Id<'testimonials'>) => {
    try {
      await revokeRequest({ testimonialId });
      toast.success('Testimonial request revoked');
    } catch {
      toast.error('Failed to revoke request');
    }
  };

  return (
    <main
      className="platform-page min-h-screen"
      data-route-landmark="testimonials"
    >
      <PageHeading
        index="06 / Evidence"
        title="Testimonials"
        description="Request, review, and publish recommendations from people who know your work."
        actions={
          <Button onClick={() => void handleCreateRequest()}>
            <Copy className="h-4 w-4 mr-2" />
            Request testimonial
          </Button>
        }
      />

      {pendingRequests.length > 0 && (
        <Card className="mb-10 gap-0 border-x-0 bg-transparent p-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => {
              const expired = isTestimonialRequestExpired(
                request.tokenExpiresAt,
                currentTime
              );
              const requestToken = request.requestToken;
              return (
                <div
                  key={request._id}
                  className="flex flex-col items-start justify-between gap-3 border-t py-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{expired ? 'Expired' : 'Awaiting response'}</span>
                    </div>
                    {request.tokenExpiresAt && (
                      <p className="mt-1 text-xs">
                        {expired ? 'Expired' : 'Expires'}{' '}
                        {formatDistanceToNow(request.tokenExpiresAt, {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={expired || !requestToken}
                      onClick={() => {
                        if (requestToken) {
                          void handleCopyRequest(requestToken);
                        }
                      }}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      {copiedToken === requestToken ? 'Copied' : 'Copy link'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleRevokeRequest(request._id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {pendingTestimonials.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Pending Approval</h2>
          <div className="space-y-4">
            {pendingTestimonials.map((testimonial) => (
              <Card
                key={testimonial._id}
                className="gap-0 border-x-0 bg-transparent p-0"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
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
                    <div className="flex flex-wrap gap-2 sm:ml-4">
                      <Button
                        size="sm"
                        onClick={() => void handleApprove(testimonial._id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleReject(testimonial._id)}
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
              <Card
                key={testimonial._id}
                className="gap-0 border-x-0 bg-transparent p-0"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
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
                      onClick={() => void handleDelete(testimonial._id)}
                      aria-label={`Delete testimonial from ${testimonial.authorName}`}
                      title="Delete testimonial"
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
        <Card className="gap-0 border-x-0 bg-transparent p-0">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No testimonials yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Request recommendations from colleagues and clients
            </p>
            <Button className="mt-4" onClick={() => void handleCreateRequest()}>
              <Copy className="h-4 w-4 mr-2" />
              Request Testimonial
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
