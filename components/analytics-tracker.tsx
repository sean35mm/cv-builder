'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useRef } from 'react';
import type { Id } from '@/convex/_generated/dataModel';

type Props = {
  profileId: Id<'profiles'>;
};

export function AnalyticsTracker({ profileId }: Props) {
  const recordView = useMutation(api.analytics.recordView);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const referrer = document.referrer || undefined;

    recordView({
      profileId,
      referrer: referrer ? new URL(referrer).hostname : undefined,
    }).catch(() => {
      // Silently fail - analytics shouldn't break the page
    });
  }, [profileId, recordView]);

  return null;
}
