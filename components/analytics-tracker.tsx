'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useRef } from 'react';

type Props = {
  profileId: string;
};

export function AnalyticsTracker({ profileId }: Props) {
  const recordView = useMutation(api.analytics.recordEvent);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const referrer = document.referrer || undefined;
    const countryCode = undefined;

    recordView({
      profileId: profileId as any,
      eventType: 'view',
      referrer: referrer ? new URL(referrer).hostname : undefined,
      countryCode,
    }).catch(() => {
      // Silently fail - analytics shouldn't break the page
    });
  }, [profileId, recordView]);

  return null;
}
