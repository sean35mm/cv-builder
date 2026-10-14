import { getSiteOrigin } from '@/lib/custom-domains/server-config';
import { SITE_DESCRIPTION } from '@/lib/site';

// A plain-text guide for AI agents: https://llmstxt.org
export function GET() {
  const origin = getSiteOrigin().replace(/\/$/, '');
  const body = `# OpenCV

> ${SITE_DESCRIPTION}

OpenCV is free. Each person gets one profile at ${origin}/u/{username}, written in an editor and shown in one of three templates (Editorial, Rail, Ledger) and six color palettes.

## Profiles

- Profile page: ${origin}/u/{username}
- Structured data: every public profile embeds schema.org ProfilePage JSON-LD with a Person as mainEntity.
- Machine-readable CV: ${origin}/api/export?username={username}&format=json (public profiles link it with rel="alternate" type="application/json").
- PDF: ${origin}/api/pdf?username={username}
- Index of public profiles: ${origin}/sitemap.xml

Profiles can be public, unlisted, passcode-protected, or private. Only public profiles are listed in the sitemap or meant to be indexed. Unlisted and passcode profiles are shared by their owners and should not be indexed or republished.

## Site

- Home and sign-up: ${origin}/
- Privacy policy: ${origin}/privacy
- Terms: ${origin}/terms
- Source code: https://github.com/sean35mm/cv-builder
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
