'use client';

import { useEffect, useRef, useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';

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
    const stored = window.localStorage.getItem('opencv_analytics_consent');
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
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl border bg-background p-4 text-sm"
    >
      <p>
        Allow privacy-preserving profile analytics? We store coarse device,
        campaign, referrer host, and trusted country data for up to 90
        days—never your IP address.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-[2px] bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => {
            window.localStorage.setItem('opencv_analytics_consent', 'yes');
            setConsent('yes');
          }}
        >
          Allow
        </button>
        <button
          type="button"
          className="min-h-11 rounded-[2px] border px-4 py-2"
          onClick={() => {
            window.localStorage.setItem('opencv_analytics_consent', 'no');
            setConsent('no');
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
