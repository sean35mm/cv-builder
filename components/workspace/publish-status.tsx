'use client';

import { ArrowUpRight } from 'lucide-react';
import { Component, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { StatsPopover } from '@/components/workspace/stats-popover';
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
  analyticsEnabled,
  profileUrl,
  onShare,
}: {
  accessMode: ProfileAccessMode;
  analyticsEnabled?: boolean;
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
      {live && analyticsEnabled === false ? (
        <span className="truncate text-subtle">View analytics are off</span>
      ) : live ? (
        <QuietBoundary>
          <StatsPopover />
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
