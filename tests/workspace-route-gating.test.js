import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('workspace route gating', () => {
  for (const route of ['testimonials', 'domains']) {
    test(`${route} waits for auth and profile readiness`, () => {
      const page = source(`app/${route}/page.tsx`);

      expect(page).toContain(
        'const loggedInUser = useQuery(api.auth.loggedInUser)'
      );
      expect(page).toContain("loggedInUser ? {} : 'skip'");
      expect(page).toContain("loggedInUser && profile ? {} : 'skip'");
      expect(page).toContain("router.replace('/')");
      expect(page).toContain('if (loggedInUser === null) return null;');
      expect(page).toContain('if (!profile) return <ActivityNoProfile />;');
    });

    test(`${route} keeps route queries and controls behind readiness guards`, () => {
      const page = source(`app/${route}/page.tsx`);
      const anonymousGuard = page.indexOf(
        'if (loggedInUser === null) return null;'
      );
      const profileGuard = page.indexOf(
        'if (!profile) return <ActivityNoProfile />;'
      );
      const routeLandmark = page.indexOf(`data-route-landmark="${route}"`);

      expect(anonymousGuard).toBeGreaterThan(-1);
      expect(profileGuard).toBeGreaterThan(anonymousGuard);
      expect(routeLandmark).toBeGreaterThan(profileGuard);
    });
  }
});
