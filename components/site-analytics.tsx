'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

// Vercel Web Analytics for OpenCV's own pages only. Public profiles keep their
// consent-based analytics and stay out of the free plan's event allowance.
// The free plan has no UTM report, so visits from the "Made with OpenCV"
// footer are reported as their own page, /from-profile.
const labelReferral = (event: BeforeSendEvent): BeforeSendEvent => {
  const url = new URL(event.url);
  if (url.searchParams.get('ref') !== 'profile') return event;
  url.pathname = '/from-profile';
  url.search = '';
  return { ...event, url: url.toString() };
};

export function SiteAnalytics() {
  return <Analytics beforeSend={labelReferral} />;
}
