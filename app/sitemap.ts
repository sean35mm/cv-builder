import { fetchQuery } from 'convex/nextjs';
import type { MetadataRoute } from 'next';

import { api } from '@/convex/_generated/api';
import { profileCanonicalUrl } from '@/lib/custom-domains/access-metadata';
import { getSiteOrigin } from '@/lib/custom-domains/server-config';

export const dynamic = 'force-dynamic';

const publicRoutes = ['/', '/directory', '/roadmap', '/changelog'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteOrigin = getSiteOrigin();
  const urls = new Set(
    publicRoutes.map((pathname) => new URL(pathname, siteOrigin).href)
  );

  try {
    let cursor: string | undefined;
    for (let pageNumber = 0; pageNumber < 1_000; pageNumber += 1) {
      const page = await fetchQuery(api.directory.listSitemap, {
        cursor,
        pageSize: 100,
      });
      for (const item of page.items) {
        urls.add(
          profileCanonicalUrl(siteOrigin, item.username, item.customHostname)
        );
      }
      if (page.isDone) {
        return Array.from(urls).map((url) => ({ url }));
      }
      if (!page.continueCursor || page.continueCursor === cursor) break;
      cursor = page.continueCursor;
    }
    return Array.from(urls).map((url) => ({ url }));
  } catch {
    return Array.from(urls).map((url) => ({ url }));
  }
}
