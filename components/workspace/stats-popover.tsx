'use client';

import { useQuery } from 'convex/react';
import { useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

const RANGES = [7, 30] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_ROWS = 5;

const count = (n: number, capped: boolean) => `${n}${capped ? '+' : ''}`;

// viewsByDay only lists days with views (UTC); fill the gaps so the bars line
// up with the calendar. The oldest partial day the query covers is dropped.
function fillDays(
  viewsByDay: { date: string; count: number }[],
  days: number,
  now = Date.now()
) {
  const byDate = new Map(viewsByDay.map((d) => [d.date, d.count]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now - (days - 1 - i) * DAY_MS)
      .toISOString()
      .slice(0, 10);
    return { date, count: byDate.get(date) ?? 0 };
  });
}

const formatDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

function countryName(code: string) {
  try {
    return (
      new Intl.DisplayNames(undefined, { type: 'region' }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

// The 7-day count in the preview bar; opens the full stats.
export function StatsPopover() {
  const stats = useQuery(api.analytics.getProfileStats, { days: 7 });
  if (!stats) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="truncate rounded text-subtle hover:text-foreground"
        >
          <span className="tabular-nums">
            {count(stats.totalViews, stats.isCapped)}
          </span>{' '}
          {stats.totalViews === 1 ? 'view' : 'views'} in the last 7 days
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 border border-border p-3 text-[12px]"
      >
        <StatsPanel />
      </PopoverContent>
    </Popover>
  );
}

function StatsPanel() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const stats = useQuery(api.analytics.getProfileStats, { days });
  const referrers = useQuery(api.analytics.getReferrersReport, { days });
  const countries = useQuery(api.analytics.getGeography, { days });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-foreground">Visitors</h2>
        <div
          role="group"
          aria-label="Date range"
          className="flex rounded-md border border-border p-0.5"
        >
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              onClick={() => setDays(range)}
              className={cn(
                'rounded px-2 py-0.5 text-muted-foreground hover:text-foreground',
                days === range && 'bg-muted text-foreground'
              )}
            >
              {range} days
            </button>
          ))}
        </div>
      </div>

      {!stats ? (
        <div aria-busy="true" className="h-40" />
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-2">
            <Total
              label="Views"
              value={count(stats.totalViews, stats.isCapped)}
            />
            <Total
              label="PDF downloads"
              value={count(stats.totalPdfDownloads, stats.isCapped)}
            />
            <Total
              label="Link clicks"
              value={count(stats.totalLinkClicks, stats.isCapped)}
            />
          </dl>

          {stats.totalViews === 0 ? (
            <p className="py-4 text-center text-subtle">
              No views in the last {days} days. Share your link to see who
              visits.
            </p>
          ) : (
            <>
              <DailyViews
                days={days}
                viewsByDay={stats.viewsByDay}
                capped={stats.isCapped}
              />
              <TopList
                title="Top referrers"
                rows={referrers?.items.map((r) => ({
                  label: r.referrer,
                  count: r.count,
                }))}
                capped={stats.isCapped}
              />
              <TopList
                title="Top countries"
                rows={countries?.map((c) => ({
                  label: countryName(c.countryCode),
                  count: c.count,
                }))}
                capped={stats.isCapped}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <dt className="truncate text-subtle">{label}</dt>
      <dd className="font-serif text-xl leading-tight tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function DailyViews({
  days,
  viewsByDay,
  capped,
}: {
  days: number;
  viewsByDay: { date: string; count: number }[];
  capped: boolean;
}) {
  const series = fillDays(viewsByDay, days);
  const max = Math.max(...series.map((d) => d.count), 1);
  const peak = series.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <div>
      <div aria-hidden="true" className="flex h-14 items-end gap-px">
        {series.map((d) => (
          <div
            key={d.date}
            title={`${formatDay(d.date)}: ${d.count}`}
            className={cn(
              'min-h-px flex-1 rounded-t-[1px]',
              d.count ? 'bg-foreground/70' : 'bg-border'
            )}
            style={{ height: `${(d.count / max) * 100}%` }}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="mt-1 flex justify-between text-[11px] text-subtle"
      >
        <span>{formatDay(series[0].date)}</span>
        <span>{formatDay(series[series.length - 1].date)}</span>
      </div>
      <p className="sr-only">
        Daily views for the last {days} days. Busiest day was{' '}
        {formatDay(peak.date)} with {count(peak.count, capped)}{' '}
        {peak.count === 1 ? 'view' : 'views'}.
      </p>
    </div>
  );
}

function TopList({
  title,
  rows,
  capped,
}: {
  title: string;
  rows?: { label: string; count: number }[];
  capped: boolean;
}) {
  // Referrers and countries are only recorded for some visits; hide when empty.
  if (!rows?.length) return null;
  return (
    <section>
      <h3 className="mb-1 text-subtle">{title}</h3>
      <ul className="flex flex-col gap-0.5">
        {rows.slice(0, TOP_ROWS).map((row) => (
          <li key={row.label} className="flex justify-between gap-3">
            <span className="truncate text-foreground">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {count(row.count, capped)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
