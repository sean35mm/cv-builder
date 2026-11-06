import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { transpileModule, ModuleKind, JsxEmit } from 'typescript';

// Invoke the real page and metadata with an isolated backend, not a live account.
function loadPage({
  query = async () => null,
  service = async () => ({ ok: true, data: null }),
} = {}) {
  const deps = {
    react: { cache: (fn) => fn },
    'react/jsx-runtime': {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    'convex/nextjs': { fetchQuery: query },
    'next/headers': { cookies: async () => ({ get: () => undefined }) },
    'next/navigation': {
      notFound: () => {
        throw new Error('TEST_NOT_FOUND');
      },
    },
    'next/cache': { unstable_noStore: () => {} },
    '@convex-dev/auth/nextjs/server': {
      convexAuthNextjsToken: async () => null,
    },
    '@/convex/_generated/api': {
      api: {
        profiles: { getProfileByUsername: 'profile' },
        profileLocales: { getByUsername: 'locale' },
      },
    },
    '@/lib/profile/passcode-server': {
      profileAccessService: service,
      grantTokenForUsername: () => undefined,
    },
    '@/lib/profile/access': {
      getProfileRobotsPolicy: () => ({ index: false }),
    },
    '@/components/profile-passcode-form': {
      ProfilePasscodeForm: 'PasscodeForm',
    },
  };
  const { outputText } = transpileModule(
    readFileSync(
      new URL('../app/u/[username]/page.tsx', import.meta.url),
      'utf8'
    ),
    { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }
  );
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    (name) => deps[name] ?? {},
    loaded,
    loaded.exports
  );
  return loaded.exports;
}
const props = (locale) => ({
  params: Promise.resolve({ username: 'alice', locale }),
});

describe('public profile failure classification', () => {
  test.each([undefined, 'fr'])(
    'backend failure is not converted into a 404 for locale %s',
    async (locale) => {
      const page = loadPage({
        query: async () => {
          throw new Error('TEST_BACKEND_UNAVAILABLE');
        },
      });
      await expect(page.default(props(locale))).rejects.toThrow(
        'TEST_BACKEND_UNAVAILABLE'
      );
      await expect(page.generateMetadata(props(locale))).rejects.toThrow(
        'TEST_BACKEND_UNAVAILABLE'
      );
    }
  );
  test('a genuine missing or private profile stays indistinguishable', async () => {
    const page = loadPage();
    await expect(page.default(props())).rejects.toThrow('TEST_NOT_FOUND');
    expect(await page.generateMetadata(props())).toMatchObject({
      title: 'Profile Not Found',
    });
  });
  test('failed envelope service reaches error handling, not a 404', async () => {
    const page = loadPage({
      service: async () => ({ ok: false, status: 503, data: null }),
    });
    await expect(page.default(props())).rejects.toThrow(
      'service is unavailable'
    );
  });
  test('an unauthorized bundle shows the passcode form; an outage does not', async () => {
    let failed = false;
    const page = loadPage({
      service: async (path) =>
        path === 'envelope'
          ? {
              ok: true,
              data: { username: 'alice', profileId: 'p1', mode: 'passcode' },
            }
          : { ok: false, data: null, status: failed ? 503 : 401 },
    });
    expect((await page.default(props())).type).toBe('PasscodeForm');
    failed = true;
    await expect(page.default(props())).rejects.toThrow(
      'service is unavailable'
    );
  });
});
