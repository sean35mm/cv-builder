import type { MetadataRoute } from 'next';

import { getSiteOrigin } from '@/lib/custom-domains/server-config';

export default function robots(): MetadataRoute.Robots {
  const siteOrigin = getSiteOrigin();

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', siteOrigin).href,
  };
}
