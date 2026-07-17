import { fetchQuery } from 'convex/nextjs';
import type { MetadataRoute } from 'next';

import { api } from '@/convex/_generated/api';
import { profileCanonicalUrl } from '@/lib/custom-domains/access-metadata';
import { getSiteOrigin } from '@/lib/custom-domains/server-config';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const urls = new Set<string>();
    let cursor: string | undefined;
    for (let pageNumber = 0; pageNumber < 1_000; pageNumber += 1) {
      const page = await fetchQuery(api.directory.listSitemap, {
        cursor,
        pageSize: 100,
      });
      for (const item of page.items) {
        urls.add(
          profileCanonicalUrl(
            getSiteOrigin(),
            item.username,
            item.customHostname
          )
        );
      }
      if (page.isDone) {
        return Array.from(urls).map((url) => ({ url }));
      }
      if (!page.continueCursor || page.continueCursor === cursor) return [];
      cursor = page.continueCursor;
    }
    return [];
  } catch {
    return [];
  }
}
