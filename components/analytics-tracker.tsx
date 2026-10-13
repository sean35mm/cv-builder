'use client';

import { useEffect, useRef, useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { buttonVariants } from '@/components/ui/button';

type Props = {
  profileId: Id<'profiles'>;
  username?: string;
  protectedProfile?: boolean;
  hostBound?: boolean;
  analyticsEnabled?: boolean;
};

export function AnalyticsTracker({
  profileId,
  username,
  protectedProfile = false,
  hostBound = false,
  analyticsEnabled = true,
}: Props) {
  const hasTracked = useRef(false);
  const [consent, setConsent] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    const navigatorWithPrivacy = navigator as Navigator & {
      globalPrivacyControl?: boolean;
    };
    if (
      !analyticsEnabled ||
      navigatorWithPrivacy.globalPrivacyControl === true ||
      navigator.doNotTrack === '1'
    ) {
      queueMicrotask(() => setConsent('no'));
      return;
    }
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem('opencv_analytics_consent');
    } catch {
      // Keep consent unset so the prompt remains available.
    }
    queueMicrotask(() =>
      setConsent(stored === 'yes' || stored === 'no' ? stored : null)
    );
  }, [analyticsEnabled]);

  useEffect(() => {
    if (hasTracked.current || consent !== 'yes' || !analyticsEnabled) return;
    hasTracked.current = true;

    const search = new URLSearchParams(window.location.search);
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        username,
        protectedProfile,
        referrer: document.referrer || undefined,
        utmSource: search.get('utm_source') ?? undefined,
        utmMedium: search.get('utm_medium') ?? undefined,
        utmCampaign: search.get('utm_campaign') ?? undefined,
      }),
    }).catch(() => {
      // Silently fail - analytics shouldn't break the page
    });
  }, [
    analyticsEnabled,
    consent,
    hostBound,
    profileId,
    protectedProfile,
    username,
  ]);

  if (!analyticsEnabled || consent !== null) return null;
  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="fixed inset-x-3 bottom-3 z-50 rounded-lg bg-surface p-3 text-[12.5px] text-foreground shadow-popover sm:inset-x-auto sm:left-4 sm:bottom-4 sm:max-w-sm print:hidden"
    >
      <p className="leading-5 text-muted-foreground">
        Allow privacy-preserving profile analytics? We store coarse device,
        campaign, referrer host, and trusted country data for up to 90
        days—never your IP address.
      </p>
      <div className="mt-2.5 flex gap-1.5">
        <button
          type="button"
          className={buttonVariants({ size: 'sm' })}
          onClick={() => {
            try {
              window.localStorage.setItem('opencv_analytics_consent', 'yes');
            } catch {
              // In-memory consent still applies for this visit.
            }
            setConsent('yes');
          }}
        >
          Allow
        </button>
        <button
          type="button"
          className={buttonVariants({ size: 'sm', variant: 'ghost' })}
          onClick={() => {
            try {
              window.localStorage.setItem('opencv_analytics_consent', 'no');
            } catch {
              // In-memory consent still applies for this visit.
            }
            setConsent('no');
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
