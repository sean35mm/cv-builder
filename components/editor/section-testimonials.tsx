'use client';

import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { Check, Copy, Link2, Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { isTestimonialRequestExpired } from '@/convex/testimonialExpiry';

type Testimonial = FunctionReturnType<
  typeof api.testimonials.getTestimonials
>[number];

const requestUrl = (token: string) =>
  `${window.location.origin}/recommend/${token}`;

const formatDay = (time: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(time);

const byline = (item: Testimonial) =>
  [
    [item.authorTitle, item.authorCompany].filter(Boolean).join(', '),
    item.relationship,
  ]
    .filter(Boolean)
    .join(' · ');

// Testimonials live in their own table, not the autosaved profile form, so
// this section reads and writes Convex directly.
export function SectionTestimonials() {
  const testimonials = useQuery(api.testimonials.getTestimonials);
  const createRequest = useMutation(api.testimonials.createTestimonialRequest);
  const revokeRequest = useMutation(api.testimonials.revokeTestimonialRequest);
  const approve = useMutation(api.testimonials.approveTestimonial);
  const reject = useMutation(api.testimonials.rejectTestimonial);
  const remove = useMutation(api.testimonials.deleteTestimonial);
  const [now] = useState(Date.now);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(requestUrl(token));
      setCopied(token);
      window.setTimeout(() => setCopied(null), 1500);
      return true;
    } catch {
      return false;
    }
  };

  const create = async () => {
    setBusy('create');
    try {
      const { token } = await createRequest({});
      if (await copy(token)) toast.success('Link copied. It works for 7 days.');
      else toast.success('Link created. Copy it from the list below.');
    } catch {
      toast.error("Couldn't create a link. Try again in a minute.");
    } finally {
      setBusy(null);
    }
  };

  const run = async (
    id: Id<'testimonials'>,
    action: (args: { testimonialId: Id<'testimonials'> }) => Promise<null>,
    failure: string
  ) => {
    setBusy(id);
    try {
      await action({ testimonialId: id });
    } catch {
      toast.error(failure);
    } finally {
      setBusy(null);
    }
  };

  if (testimonials === undefined) {
    return (
      <p className="text-[13px] text-muted-foreground" aria-busy="true">
        Loading testimonials…
      </p>
    );
  }

  const requests = testimonials.filter(
    (item) => item.requestToken && !item.content
  );
  const pending = testimonials.filter(
    (item) => item.content && !item.isApproved
  );
  const approved = testimonials.filter((item) => item.isApproved);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-3">
        <p className="text-[13px] leading-5 text-muted-foreground">
          Send a link to someone you&apos;ve worked with. Each link works once
          and expires after 7 days. Nothing shows on your profile until you
          approve it.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy === 'create'}
          onClick={() => void create()}
        >
          <Link2 aria-hidden="true" />
          Create request link
        </Button>
      </div>

      {pending.length > 0 && (
        <Group title="Waiting for approval" count={pending.length}>
          {pending.map((item) => (
            <TestimonialRow key={item._id} item={item}>
              <Button
                type="button"
                size="sm"
                disabled={busy === item._id}
                onClick={() =>
                  void run(item._id, approve, "Couldn't approve. Try again.")
                }
              >
                <Check aria-hidden="true" />
                Approve
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy === item._id}
                onClick={() => {
                  if (
                    window.confirm(
                      `Reject ${item.authorName}'s testimonial? It will be deleted.`
                    )
                  ) {
                    void run(item._id, reject, "Couldn't reject. Try again.");
                  }
                }}
              >
                <X aria-hidden="true" />
                Reject
              </Button>
            </TestimonialRow>
          ))}
        </Group>
      )}

      {requests.length > 0 && (
        <Group title="Open requests" count={requests.length}>
          {requests.map((item) => {
            const token = item.requestToken ?? '';
            const expired = isTestimonialRequestExpired(
              item.tokenExpiresAt,
              now
            );
            return (
              <li
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
              >
                <p className="text-[13px] text-foreground">
                  Request link
                  <span className="text-subtle">
                    {' · '}
                    {expired || !item.tokenExpiresAt
                      ? 'Expired'
                      : `Expires ${formatDay(item.tokenExpiresAt)}`}
                  </span>
                </p>
                <div className="flex gap-1">
                  {!expired && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void copy(token).then(
                          (ok) => ok || toast.error("Couldn't copy the link")
                        )
                      }
                    >
                      {copied === token ? (
                        <Check className="text-success" aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                      {copied === token ? 'Copied' : 'Copy link'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy === item._id}
                    onClick={() =>
                      void run(
                        item._id,
                        revokeRequest,
                        "Couldn't revoke the link. Try again."
                      )
                    }
                  >
                    {expired ? 'Remove' : 'Revoke'}
                  </Button>
                </div>
              </li>
            );
          })}
        </Group>
      )}

      {approved.length > 0 && (
        <Group title="On your profile" count={approved.length}>
          {approved.map((item) => (
            <TestimonialRow key={item._id} item={item}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy === item._id}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete ${item.authorName}'s testimonial? This can't be undone.`
                    )
                  ) {
                    void run(item._id, remove, "Couldn't delete. Try again.");
                  }
                }}
              >
                <Trash2 aria-hidden="true" />
                Delete
              </Button>
            </TestimonialRow>
          ))}
        </Group>
      )}

      {testimonials.length === 0 && (
        <p className="border-y border-border py-6 text-[13px] text-muted-foreground">
          No testimonials yet. Sections without approved testimonials stay off
          your profile.
        </p>
      )}
    </div>
  );
}

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-baseline gap-2 text-[12px] font-medium text-muted-foreground">
        {title}
        <span className="font-mono text-[11.5px] tabular-nums text-subtle">
          {count}
        </span>
      </h2>
      <ul className="divide-y divide-border border-y border-border">
        {children}
      </ul>
    </section>
  );
}

function TestimonialRow({
  item,
  children,
}: {
  item: Testimonial;
  children: ReactNode;
}) {
  const detail = byline(item);
  return (
    <li className="py-4">
      <p className="text-[13px] font-medium text-foreground">
        {item.authorName}
      </p>
      {detail && <p className="text-[12px] text-subtle">{detail}</p>}
      {/* Only the owner sees the email; profiles never show it. */}
      {item.authorEmail && (
        <p className="text-[12px] text-subtle">{item.authorEmail}</p>
      )}
      <p className="mt-2 whitespace-pre-line text-[13px] leading-5 text-muted-foreground">
        {item.content}
      </p>
      <div className="mt-3 flex gap-1">{children}</div>
    </li>
  );
}
