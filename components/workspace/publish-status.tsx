'use client';

import { useQuery } from 'convex/react';
import { ArrowUpRight } from 'lucide-react';
import { Component, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import type { ProfileAccessMode } from '@/lib/profile/access';
import { cn } from '@/lib/utils';

const ACCESS_LABELS: Record<ProfileAccessMode, string> = {
  private: 'Private',
  passcode: 'Passcode',
  unlisted: 'Unlisted',
  public: 'Public',
};

// Sits under the preview: who can see the profile, and whether anyone has.
export function PublishStatus({
  accessMode,
  profileUrl,
  onShare,
}: {
  accessMode: ProfileAccessMode;
  profileUrl: string;
  onShare: () => void;
}) {
  const live = accessMode !== 'private';

  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-t border-border px-3 text-[12px] text-muted-foreground">
      <button
        type="button"
        onClick={onShare}
        className="flex items-center gap-1.5 rounded hover:text-foreground"
      >
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 rounded-full',
            live ? 'bg-success' : 'bg-subtle'
          )}
        />
        {ACCESS_LABELS[accessMode]}
      </button>
      {live ? (
        <QuietBoundary>
          <WeeklyViews />
        </QuietBoundary>
      ) : (
        <span className="truncate text-subtle">Only you can see it</span>
      )}
      <div className="ml-auto flex shrink-0 items-center">
        {live ? (
          <Button asChild variant="ghost" size="sm">
            <a href={profileUrl} target="_blank" rel="noopener noreferrer">
              Open
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={onShare}>
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}

function WeeklyViews() {
  const stats = useQuery(api.analytics.getProfileStats, { days: 7 });
  if (!stats) return null;
  const views = stats.isCapped ? `${stats.totalViews}+` : stats.totalViews;
  return (
    <span className="truncate text-subtle">
      <span className="tabular-nums">{views}</span>{' '}
      {stats.totalViews === 1 ? 'view' : 'views'} in the last 7 days
    </span>
  );
}

// The stats query throws while signing out; a missing count is fine.
class QuietBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
