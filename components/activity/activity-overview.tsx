'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';

export function ActivityLoading() {
  return (
    <div
      className="flex min-h-[400px] items-center justify-center"
      aria-busy="true"
      aria-label="Loading activity"
    >
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
    </div>
  );
}

export function ActivityNoProfile() {
  return (
    <main
      className="mx-auto min-h-screen max-w-[84rem] px-4 py-8 sm:px-6 md:py-12 lg:px-10"
      data-route-landmark="activity"
    >
      <section
        className="border-y border-border py-8 sm:py-12"
        aria-labelledby="activity-setup-title"
      >
        <h1
          id="activity-setup-title"
          className="max-w-2xl font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl"
        >
          Create your profile to see activity.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Views, downloads, messages, and recommendations will appear here.
        </p>
        <Button asChild className="mt-7">
          <Link href="/editor">Open profile editor</Link>
        </Button>
      </section>
    </main>
  );
}

export function ActivityOverview() {
  const unreadMessages = useQuery(api.messages.getUnreadCount, {});
  const stats = useQuery(api.analytics.getProfileStats, { days: 30 });

  const unreadSignal =
    unreadMessages === undefined
      ? 'Loading…'
      : unreadMessages.isCapped
        ? '1,000+ unread'
        : `${unreadMessages.count} unread`;
  const analyticsSignal =
    stats === undefined
      ? 'Loading…'
      : stats.isCapped
        ? `≥ ${stats.totalViews} views`
        : `${stats.totalViews} views`;
  const analyticsDetail =
    stats === undefined
      ? 'Your last 30 days of profile reach are being prepared.'
      : stats.totalPdfDownloads > 0
        ? `${stats.totalPdfDownloads} PDF download${stats.totalPdfDownloads === 1 ? '' : 's'} in the last 30 days.`
        : 'No PDF downloads recorded in the last 30 days.';
  const downloadSignal =
    stats === undefined
      ? 'Loading…'
      : stats.isCapped
        ? `≥ ${stats.totalPdfDownloads}`
        : `${stats.totalPdfDownloads}`;

  return (
    <main
      className="mx-auto min-h-screen max-w-[84rem] px-4 py-8 sm:px-6 md:py-12 lg:px-10"
      data-route-landmark="activity"
    >
      <header className="mb-8 md:mb-10">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
          Activity
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          Profile activity from the last 30 days.
        </p>
      </header>

      <div
        className="divide-y divide-border border-y border-border"
        aria-label="Activity overview"
      >
        <ActivityCard
          label="Profile views"
          value={analyticsSignal}
          detail="Recorded profile visits"
          href="/analytics"
          action="View analytics"
        />
        <ActivityCard
          label="PDF downloads"
          value={downloadSignal}
          detail={analyticsDetail}
          href="/analytics"
          action="View analytics"
        />
        <ActivityCard
          label="Messages"
          value={unreadSignal}
          detail="Messages sent from your profile"
          href="/inbox"
          action="Open inbox"
        />
        <ActivityCard
          label="Recommendations"
          value="Requests and responses"
          detail="Review responses or create a request"
          href="/testimonials"
          action="Manage recommendations"
        />
      </div>
    </main>
  );
}

function ActivityCard({
  label,
  value,
  detail,
  href,
  action,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
  action: string;
}) {
  return (
    <section className="grid gap-4 py-6 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-center sm:gap-8">
      <h2 className="text-sm font-medium">{label}</h2>
      <div>
        <p className="font-display text-2xl font-semibold tracking-[-0.02em]">
          {value}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <div>
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {action}
        </Link>
      </div>
    </section>
  );
}
