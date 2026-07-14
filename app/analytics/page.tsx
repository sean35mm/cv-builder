'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from 'next-themes';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Eye, Download, Link } from 'lucide-react';
import { useState } from 'react';

const DAY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const stats = useQuery(api.analytics.getProfileStats, { days });
  const referrers = useQuery(api.analytics.getReferrers, { days });

  const chartColor = isDark ? '#8b9a6b' : '#5a6b4a';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#9ca3af' : '#6b7280';

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Insights into your profile visitors
            </p>
          </div>
          <label htmlFor="analytics-period" className="sr-only">
            Analytics period
          </label>
          <select
            id="analytics-period"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border bg-card px-3 py-1.5 text-sm"
          >
            {DAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {(stats.isCapped || referrers?.isCapped) && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
            This range has more than 10,000 events. Totals marked with ≥ are
            minimums, and chart and referrer data are partial.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon={<Eye className="h-4 w-4" />}
            label="Profile Views"
            value={stats.totalViews}
            isMinimum={stats.isCapped}
          />
          <StatCard
            icon={<Download className="h-4 w-4" />}
            label="PDF Downloads"
            value={stats.totalPdfDownloads}
            isMinimum={stats.isCapped}
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-base font-medium">
            Views Over Time{stats.isCapped ? ' (partial)' : ''}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.viewsByDay}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColor}
                      stopOpacity={0.3}
                    />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
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
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: '1px solid',
                    borderColor: gridColor,
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={chartColor}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-medium">
            <Link className="h-4 w-4" />
            Top Referrers{referrers?.isCapped ? ' (partial)' : ''}
          </h2>
          {referrers && referrers.items.length > 0 ? (
            <div className="space-y-2">
              {referrers.items.map((referrer) => (
                <div
                  key={referrer.referrer}
                  className="flex items-center justify-between text-sm"
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
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  isMinimum = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  isMinimum?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">
        {isMinimum ? '≥ ' : ''}
        {value}
      </p>
    </div>
  );
}
