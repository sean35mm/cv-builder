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
  BarChart,
  Bar,
} from 'recharts';
import { Eye, Download, MousePointerClick, Globe, Link } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
  const geography = useQuery(api.analytics.getGeography, { days });
  const linkClicks = useQuery(api.analytics.getLinkClicks, { days });

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
          <select
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

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Eye className="h-4 w-4" />}
            label="Profile Views"
            value={stats.totalViews}
          />
          <StatCard
            icon={<Download className="h-4 w-4" />}
            label="PDF Downloads"
            value={stats.totalPdfDownloads}
          />
          <StatCard
            icon={<MousePointerClick className="h-4 w-4" />}
            label="Link Clicks"
            value={stats.totalLinkClicks}
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-base font-medium">Views Over Time</h2>
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-medium">
              <Link className="h-4 w-4" />
              Top Referrers
            </h2>
            {referrers && referrers.length > 0 ? (
              <div className="space-y-2">
                {referrers.map((r) => (
                  <div
                    key={r.referrer}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      {r.referrer}
                    </span>
                    <span className="font-medium">{r.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No referrer data</p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-medium">
              <Globe className="h-4 w-4" />
              Top Countries
            </h2>
            {geography && geography.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geography} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      type="number"
                      tick={{ fill: textColor, fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="countryCode"
                      tick={{ fill: textColor, fontSize: 12 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        border: '1px solid',
                        borderColor: gridColor,
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill={chartColor}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No geography data</p>
            )}
          </div>
        </div>

        {linkClicks && linkClicks.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-base font-medium">Link Clicks</h2>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {linkClicks.map((l) => (
                <div
                  key={l.linkType}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="capitalize text-muted-foreground">
                    {l.linkType}
                  </span>
                  <span className="font-medium">{l.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
