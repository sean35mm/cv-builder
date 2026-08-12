'use client';

import { useQuery } from 'convex/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ActivityNoProfile } from '@/components/activity/activity-overview';
import { PageHeading } from '@/components/platform/page-heading';

const DAY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);
  const analyticsArgs = loggedInUser && profile ? { days } : 'skip';
  const stats = useQuery(api.analytics.getProfileStats, analyticsArgs);
  const referrers = useQuery(api.analytics.getReferrersReport, analyticsArgs);
  const router = useRouter();

  useEffect(() => {
    if (loggedInUser === null) {
      router.replace('/');
    }
  }, [loggedInUser, router]);

  const chartColor = 'hsl(var(--foreground))';
  const gridColor = 'hsl(var(--border))';
  const textColor = 'hsl(var(--muted-foreground))';
  const tooltipBackground = 'hsl(var(--popover))';
  const tooltipForeground = 'hsl(var(--popover-foreground))';

  if (loggedInUser === undefined || profile === undefined) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
        aria-label="Loading analytics"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </main>
    );
  }

  if (loggedInUser === null) return null;
  if (!profile) return <ActivityNoProfile />;

  if (stats === undefined) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
        aria-label="Loading analytics"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </main>
    );
  }

  return (
    <main
      className="mx-auto min-h-screen max-w-[84rem] px-4 py-8 sm:px-6 md:py-12 lg:px-10"
      data-route-landmark="analytics"
    >
      <div className="space-y-8">
        <Link
          href="/activity"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Activity
        </Link>
        <PageHeading
          title="Analytics"
          description="Aggregate profile views, PDF downloads, and referrers."
          actions={
            <div>
              <label htmlFor="analytics-period" className="sr-only">
                Analytics period
              </label>
              <select
                id="analytics-period"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="min-h-11 rounded border border-border bg-card px-3 py-1.5 text-sm"
              >
                {DAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {(stats.isCapped || referrers?.isCapped) && (
          <p
            className="rounded border border-border bg-secondary px-4 py-3 text-sm text-foreground"
            role="status"
          >
            This range has more than 10,000 events. Totals marked with ≥ are
            minimums, and chart and referrer data are partial.
          </p>
        )}

        <div className="grid divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <StatCard
            label="Profile views"
            value={stats.totalViews}
            isMinimum={stats.isCapped}
          />
          <StatCard
            label="PDF downloads"
            value={stats.totalPdfDownloads}
            isMinimum={stats.isCapped}
          />
        </div>

        <section className="border-y border-border py-6">
          <h2 className="mb-6 font-display text-lg font-semibold">
            Views Over Time{stats.isCapped ? ' (partial)' : ''}
          </h2>
          {stats.viewsByDay.length > 0 ? (
            <div className="h-64" aria-label="Profile views by day">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.viewsByDay}>
                  <CartesianGrid vertical={false} stroke={gridColor} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: textColor, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: textColor, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBackground,
                      color: tooltipForeground,
                      border: '1px solid',
                      borderColor: gridColor,
                      borderRadius: 'var(--radius)',
                    }}
                    labelStyle={{ color: tooltipForeground }}
                    itemStyle={{ color: tooltipForeground }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={chartColor}
                    fillOpacity={0.08}
                    fill={chartColor}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-sm text-muted-foreground" role="status">
              No profile views in this range.
            </p>
          )}
        </section>

        <section className="border-b border-border pb-6">
          <h2 className="mb-5 font-display text-lg font-semibold">
            Top Referrers{referrers?.isCapped ? ' (partial)' : ''}
          </h2>
          {referrers === undefined ? (
            <p className="text-sm text-muted-foreground">Loading referrers…</p>
          ) : referrers.items.length > 0 ? (
            <div className="divide-y divide-border border-y border-border">
              {referrers.items.map((referrer) => (
                <div
                  key={referrer.referrer}
                  className="flex min-h-12 items-center justify-between px-1 text-sm"
                >
                  <span className="truncate text-muted-foreground">
                    {referrer.referrer}
                  </span>
                  <span className="font-medium">
                    {referrers.isCapped ? '≥ ' : ''}
                    {referrer.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No referrer data</p>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  isMinimum = false,
}: {
  label: string;
  value: number;
  isMinimum?: boolean;
}) {
  return (
    <div className="p-6 first:pl-0 last:pr-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-5 font-display text-4xl font-semibold tracking-[-0.02em] tabular-nums">
        {isMinimum ? '≥ ' : ''}
        {value}
      </p>
    </div>
  );
}
