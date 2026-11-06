import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from 'typescript';
import { v } from 'convex/values';
import { NextRequest, NextResponse } from 'next/server';
import * as consent from '../lib/analytics/consent';
import * as privacy from '../lib/analytics/privacy';
import * as retention from '../lib/analytics/retention';
import * as requestSecurity from '../lib/profile/request-security';
import { stableRateLimitKey } from '../convex/rateLimitKey';

// Execute production handlers with isolated dependencies, never a live backend.
function load(path, dependencies, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const { outputText } = transpileModule(source, {
    compilerOptions: {
      module: ModuleKind.CommonJS,
      target: ScriptTarget.ES2020,
      jsx: JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: path,
  });
  const loaded = { exports: {} };
  const require = (name) => {
    if (!(name in dependencies))
      throw new Error(`Unmocked dependency: ${name}`);
    return dependencies[name];
  };
  new Function(
    'require',
    'module',
    'exports',
    ...Object.keys(globals),
    outputText
  )(require, loaded, loaded.exports, ...Object.values(globals));
  return loaded.exports;
}

const internal = {
  analytics: {
    deleteExpired: 'analytics:deleteExpired',
    recordView: 'analytics:recordView',
  },
  pdf: { completeDownload: 'pdf:completeDownload' },
  profileAccess: { recordProtectedEvent: 'profileAccess:recordProtectedEvent' },
};
const server = {
  internalMutation: (definition) => definition,
  query: (definition) => definition,
  httpAction: (handler) => handler,
};
const profile = {
  _id: 'profile123',
  userId: 'user123',
  username: 'alice',
  name: 'Alice',
};
const callerHash = 'a'.repeat(64);
const receiptToken = 'r'.repeat(48);
const serviceSecret = 'test-only-service-secret'.repeat(2);

function database(initial = {}) {
  let tables = structuredClone(initial);
  const reads = [];
  const db = {
    query(table) {
      const predicates = [];
      const index = {
        eq(field, value) {
          predicates.push((row) => row[field] === value);
          return index;
        },
        lt(field, value) {
          predicates.push((row) => row[field] < value);
          return index;
        },
      };
      const rows = () =>
        (tables[table] ?? []).filter((row) => predicates.every((p) => p(row)));
      const query = {
        withIndex(name, range) {
          range(index);
          reads.push({ table, name });
          return query;
        },
        order(direction) {
          expect(direction).toBe('asc');
          return query;
        },
        async take(limit) {
          reads.push({ table, limit });
          return rows().slice(0, limit);
        },
        async first() {
          return rows()[0] ?? null;
        },
        async unique() {
          expect(rows().length).toBeLessThanOrEqual(1);
          return rows()[0] ?? null;
        },
      };
      return query;
    },
    async get(id) {
      return (
        Object.values(tables)
          .flat()
          .find((row) => row._id === id) ?? null
      );
    },
    async delete(id) {
      for (const table of Object.keys(tables))
        tables[table] = tables[table].filter((row) => row._id !== id);
    },
    async insert(table, row) {
      const id = `${table}-${(tables[table] ?? []).length}`;
      (tables[table] ??= []).push({ ...row, _id: id });
      return id;
    },
  };
  return {
    db,
    reads,
    rows: (table) => tables[table] ?? [],
    // Convex rolls back both writes and scheduled jobs on mutation failure.
    async transaction(handler, ctx, args = {}) {
      const snapshot = structuredClone(tables);
      try {
        return await handler(ctx, args);
      } catch (error) {
        tables = snapshot;
        throw error;
      }
    },
  };
}

function analyticsModule(limits = [], globals = {}) {
  return load(
    'convex/analytics.ts',
    {
      './_generated/server': server,
      './_generated/api': { internal },
      'convex/values': { v },
      '@convex-dev/auth/server': { getAuthUserId: async () => null },
      './validation': {
        optionalText: (value) => value,
        validateReportingDays: () => 30,
      },
      './rateLimits': {
        rateLimiter: {
          limit: async (_ctx, name) => {
            limits.push(name);
          },
        },
      },
      './rateLimitKey': { stableRateLimitKey },
      './publicProfiles': {
        resolveEffectivePublicProfileState: async () => ({}),
      },
      '../lib/analytics/privacy': privacy,
      '../lib/analytics/retention': retention,
    },
    globals
  );
}

function pdfModule() {
  return load('convex/pdf.ts', {
    nanoid: { nanoid: () => receiptToken },
    './_generated/server': server,
    'convex/values': { v },
    './rateLimits': { rateLimiter: { limit: async () => {} } },
    './publicProfiles': {
      resolveEffectivePublicProfileState: async () => ({}),
    },
  });
}

function httpModule() {
  return load(
    'convex/profileAccessHttp.ts',
    {
      './_generated/server': server,
      './_generated/api': { internal },
      '@convex-dev/rate-limiter': { isRateLimitError: () => false },
      '../lib/profile/argon-contract': {
        DUMMY_PROFILE_PASSCODE_HASH: 'unused',
      },
      '../lib/profile/access': { isProfileAccessMode: () => true },
      '../lib/profile/configure-limit-policy': {},
      '../lib/profile/request-security': requestSecurity,
      '../lib/profile/raster-image-policy': {},
      '../lib/analytics/privacy': privacy,
    },
    { process: { env: { PROFILE_ACCESS_SERVICE_SECRET: serviceSecret } } }
  );
}

function serviceHarness(store) {
  const analytics = analyticsModule();
  const pdf = pdfModule();
  const http = httpModule();
  const calls = [];
  const ctx = {
    async runMutation(reference, args) {
      calls.push({ reference, args });
      if (reference === internal.analytics.recordView)
        return analytics.recordView.handler({ db: store.db }, args);
      if (reference === internal.pdf.completeDownload)
        return pdf.completeDownload.handler({ db: store.db }, args);
      return true;
    },
  };
  const dispatch = async (path, body) => {
    const action = {
      'analytics-event': http.analyticsEvent,
      event: http.event,
      'pdf-complete': http.completePublicPdf,
    }[path];
    const response = await action(
      ctx,
      new Request('https://backend.invalid/service', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-profile-access-service-secret': serviceSecret,
        },
        body: JSON.stringify(body),
      })
    );
    return {
      ok: response.ok,
      status: response.status,
      data: await response.json(),
    };
  };
  return { dispatch, calls };
}

const routeDependencies = (service) => ({
  'next/server': { NextRequest, NextResponse },
  'node:crypto': { createHash },
  '@/lib/analytics/privacy': privacy,
  '@/lib/analytics/consent': consent,
  '@/lib/custom-domains/server-resolver': {
    resolveRequestHostBinding: async () => ({ kind: 'platform' }),
  },
  '@/lib/pdf/trusted-ip-header': { trustedCallerAddress: () => undefined },
  '@/lib/profile/passcode-server': {
    PROFILE_GRANT_COOKIE: 'profile_access',
    grantTokenForUsername: (value) => value,
    profileAccessService: service,
  },
  '@/lib/profile/request-security': requestSecurity,
});
const testProcess = { env: {} };
const choiceHeaders = (choice, privacyHeaders = {}) => ({
  cookie: `${choice === undefined ? '' : `${consent.ANALYTICS_CONSENT_KEY}=${choice}; `}profile_access=${'g'.repeat(43)}`,
  ...privacyHeaders,
});

describe('scheduled analytics retention runtime', () => {
  test('registers only analytics retention', () => {
    const registrations = [];
    load('convex/crons.ts', {
      'convex/server': {
        cronJobs: () => ({ interval: (...args) => registrations.push(args) }),
      },
      './_generated/api': { internal },
    });
    expect(registrations).toEqual([
      [
        'analytics retention',
        { hours: 24 },
        internal.analytics.deleteExpired,
        {},
      ],
    ]);
  });

  test('drains more than 500 expired rows, preserves cutoff/fresh rows and safely retries', async () => {
    const now = Date.now();
    const cutoff = retention.analyticsRetentionCutoff(now);
    const store = database({
      profileAnalytics: [
        ...Array.from({ length: 1203 }, (_, i) => ({
          _id: `old${i}`,
          createdAt: cutoff - 10_000 - i,
        })),
        { _id: 'boundary', createdAt: cutoff + 60_000 },
        { _id: 'fresh', createdAt: now },
      ],
    });
    const handler = analyticsModule().deleteExpired.handler;
    let failSchedule = true;
    const queue = [];
    const ctx = {
      db: store.db,
      scheduler: {
        async runAfter(delay, reference, args) {
          expect(delay).toBe(0);
          expect(reference).toBe(internal.analytics.deleteExpired);
          expect(args).toEqual({});
          if (failSchedule) throw new Error('simulated scheduler failure');
          queue.push(reference);
        },
      },
    };
    await expect(store.transaction(handler, ctx)).rejects.toThrow(
      'simulated scheduler failure'
    );
    expect(store.rows('profileAnalytics')).toHaveLength(1205);
    failSchedule = false;
    const results = [await store.transaction(handler, ctx)];
    while (queue.length) {
      queue.shift();
      results.push(await store.transaction(handler, ctx));
    }
    expect(results).toEqual([
      { deleted: 500, rescheduled: true },
      { deleted: 500, rescheduled: true },
      { deleted: 203, rescheduled: false },
    ]);
    expect(store.rows('profileAnalytics').map((row) => row._id)).toEqual([
      'boundary',
      'fresh',
    ]);
    expect(await store.transaction(handler, ctx)).toEqual({
      deleted: 0,
      rescheduled: false,
    });
    expect(
      store.reads
        .filter((read) => read.limit)
        .every((read) => read.limit === 500)
    ).toBe(true);
  });

  test('uses the exact 90-day cutoff and manual cleanup never schedules', async () => {
    // Freeze Date only in the isolated production module, not the test runner.
    const now = 1_800_000_000_000;
    const cutoff = retention.analyticsRetentionCutoff(now);
    expect(cutoff).toBe(now - 90 * 24 * 60 * 60 * 1000);
    // Feed the real query boundary into the mock index to exercise lt, not just the helper.
    const store = database({
      profileAnalytics: [
        { _id: 'old', createdAt: cutoff - 1 },
        { _id: 'boundary', createdAt: cutoff },
        { _id: 'new', createdAt: cutoff + 1 },
      ],
    });
    const fixed = analyticsModule([], { Date: { now: () => now } });
    expect(await fixed.deleteExpired.handler({ db: store.db })).toEqual({
      deleted: 1,
      rescheduled: false,
    });
    expect(store.rows('profileAnalytics').map((row) => row._id)).toEqual([
      'boundary',
      'new',
    ]);
    const backlog = database({
      profileAnalytics: Array.from({ length: 501 }, (_, i) => ({
        _id: `old${i}`,
        createdAt: cutoff - 1,
      })),
    });
    expect(
      await fixed.deleteExpiredManually.handler({ db: backlog.db })
    ).toEqual({ deleted: 500, rescheduled: false });
    expect(backlog.rows('profileAnalytics')).toHaveLength(1);
  });
});

describe('visitor consent to analytics collection runtime', () => {
  for (const [choice, signals, expected] of [
    ['yes', {}, 1],
    ['no', {}, 0],
    [undefined, {}, 0],
    ['invalid', {}, 0],
    ['yes', { dnt: '1' }, 0],
    ['yes', { 'sec-gpc': '1' }, 0],
  ]) {
    test(`view choice=${choice}, signals=${JSON.stringify(signals)}`, async () => {
      const store = database({ profiles: [profile] });
      const service = serviceHarness(store);
      const route = load(
        'app/api/analytics/event/route.ts',
        routeDependencies(service.dispatch),
        { process: testProcess }
      );
      const response = await route.POST(
        new NextRequest('https://opencv.invalid/api/analytics/event', {
          method: 'POST',
          headers: {
            host: 'opencv.invalid',
            origin: 'https://opencv.invalid',
            'content-type': 'application/json',
            ...choiceHeaders(choice, signals),
          },
          body: JSON.stringify({
            profileId: profile._id,
            username: profile.username,
            referrer: 'https://referrer.invalid/private?q=secret',
            utmCampaign: ' Summer Sale ',
            countryCode: 'SECRET',
            callerHash: 'untrusted',
          }),
        })
      );
      expect(response.status).toBe(204);
      expect(store.rows('profileAnalytics')).toHaveLength(expected);
      expect(service.calls).toHaveLength(expected);
      if (expected) {
        expect(store.rows('profileAnalytics')[0]).toMatchObject({
          profileId: profile._id,
          eventType: 'view',
          referrer: 'referrer.invalid',
          utmCampaign: 'summer-sale',
        });
        expect(store.rows('profileAnalytics')[0].countryCode).toBeUndefined();
      }
    });
  }

  test('protected views pass explicit consent and grant through authenticated service', async () => {
    const store = database();
    const service = serviceHarness(store);
    const route = load(
      'app/api/analytics/event/route.ts',
      routeDependencies(service.dispatch),
      { process: testProcess }
    );
    const response = await route.POST(
      new NextRequest('https://opencv.invalid/api/analytics/event', {
        method: 'POST',
        headers: {
          host: 'opencv.invalid',
          origin: 'https://opencv.invalid',
          'content-type': 'application/json',
          ...choiceHeaders('yes'),
        },
        body: JSON.stringify({
          profileId: profile._id,
          username: profile.username,
          protectedProfile: true,
        }),
      })
    );
    expect(response.status).toBe(204);
    expect(service.calls).toHaveLength(1);
    expect(service.calls[0].reference).toBe(
      internal.profileAccess.recordProtectedEvent
    );
    expect(service.calls[0].args.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test.each(['yes', 'no', undefined])(
    'legacy protected event route honors consent %s',
    async (choice) => {
      const service = serviceHarness(database());
      const route = load(
        'app/api/profile-access/event/route.ts',
        routeDependencies(service.dispatch),
        { process: testProcess }
      );
      const response = await route.POST(
        new NextRequest('https://opencv.invalid/api/profile-access/event', {
          method: 'POST',
          headers: {
            host: 'opencv.invalid',
            origin: 'https://opencv.invalid',
            'content-type': 'application/json',
            ...choiceHeaders(choice),
          },
          body: JSON.stringify({ username: 'alice', eventType: 'view' }),
        })
      );
      expect(response.status).toBe(204);
      expect(service.calls).toHaveLength(choice === 'yes' ? 1 : 0);
    }
  );

  test('service rejects missing consent proof, invalid metadata and untrusted callers', async () => {
    const store = database({ profiles: [profile] });
    const service = serviceHarness(store);
    expect(
      (
        await service.dispatch('analytics-event', {
          profileId: profile._id,
          username: profile.username,
        })
      ).status
    ).toBe(400);
    expect(
      (
        await service.dispatch('analytics-event', {
          profileId: profile._id,
          username: profile.username,
          analyticsConsent: true,
          referrer: 'host.invalid/private',
        })
      ).status
    ).toBe(400);
    const response = await httpModule().analyticsEvent(
      {},
      new Request('https://backend.invalid/service', { method: 'POST' })
    );
    expect(response.status).toBe(404);
    expect(service.calls).toHaveLength(0);
    expect(store.rows('profileAnalytics')).toHaveLength(0);
  });
});

function pdfRoute(
  service,
  { protectedProfile = false, rateLimited = false, renderFails = false } = {}
) {
  const calls = [];
  const dispatch = async (path, body) => {
    calls.push({ path, body });
    if (path === 'pdf-authorize-public')
      return rateLimited
        ? { ok: false, status: 429, retryAfterSeconds: 42 }
        : {
            ok: true,
            status: 200,
            data: protectedProfile
              ? null
              : {
                  profileId: profile._id,
                  username: profile.username,
                  receipt: receiptToken,
                },
          };
    if (path === 'envelope')
      return {
        ok: true,
        data: {
          profileId: profile._id,
          username: profile.username,
          mode: 'passcode',
        },
      };
    if (path === 'pdf-authorize')
      return body.token?.length === 43
        ? {
            ok: true,
            data: {
              profileId: profile._id,
              username: profile.username,
              authorization: 'grant',
            },
          }
        : { ok: false, status: 401, data: null };
    if (path === 'bundle')
      return { ok: true, data: { profile, testimonials: [] } };
    return service(path, body);
  };
  const route = load(
    'app/api/pdf/route.ts',
    {
      ...routeDependencies(dispatch),
      '@react-pdf/renderer': {
        renderToBuffer: async () => {
          if (renderFails) throw new Error('mock render failure');
          return Buffer.from('PDF');
        },
      },
      'convex/nextjs': {
        fetchQuery: async (reference) =>
          reference === 'profile' ? profile : [],
      },
      '@/convex/_generated/api': {
        api: {
          profileLocales: { getByUsername: 'profile' },
          testimonials: { getPublicTestimonials: 'testimonials' },
        },
      },
      '@/lib/profile-utils': { toProfileContent: (value) => value },
      '@/lib/pdf/resume-document': { ResumeDocument: () => null },
      react: { createElement: () => ({}) },
      '@convex-dev/auth/nextjs/server': {
        convexAuthNextjsToken: async () => undefined,
      },
    },
    { process: testProcess, console: { error: () => {} } }
  );
  return { route, calls };
}

describe('PDF analytics consent runtime', () => {
  for (const protectedProfile of [false, true]) {
    for (const [choice, signals, expected] of [
      ['yes', {}, 1],
      ['no', {}, 0],
      [undefined, {}, 0],
      ['yes', { dnt: '1' }, 0],
      ['yes', { 'sec-gpc': '1' }, 0],
    ]) {
      test(`${protectedProfile ? 'protected' : 'public'} PDF choice=${choice}, signals=${JSON.stringify(signals)}`, async () => {
        const requestHash = createHash('sha256')
          .update('pdf-caller:unavailable')
          .digest('hex');
        const store = database({
          profiles: [profile],
          pdfDownloadReceipts: [
            {
              _id: 'receipt1',
              receipt: receiptToken,
              profileId: profile._id,
              callerHash: requestHash,
              expiresAt: Date.now() + 60_000,
            },
          ],
        });
        const service = serviceHarness(store);
        const { route, calls } = pdfRoute(service.dispatch, {
          protectedProfile,
        });
        const response = await route.GET(
          new NextRequest('https://opencv.invalid/api/pdf?username=alice', {
            headers: choiceHeaders(choice, signals),
          })
        );
        expect(response.status).toBe(200);
        expect(await response.text()).toBe('PDF');
        expect(calls[0].path).toBe('pdf-authorize-public');
        if (protectedProfile) {
          expect(calls.some((call) => call.path === 'pdf-authorize')).toBe(
            true
          );
          expect(service.calls).toHaveLength(expected);
        } else {
          expect(store.rows('profileAnalytics')).toHaveLength(expected);
          expect(store.rows('pdfDownloadReceipts')).toHaveLength(0);
          expect(
            calls.find((call) => call.path === 'pdf-complete').body
              .analyticsConsent
          ).toBe(expected === 1);
        }
      });
    }
  }

  test('missing consent does not bypass rate limits; failed render records nothing', async () => {
    const request = () =>
      new NextRequest('https://opencv.invalid/api/pdf?username=alice');
    const limited = pdfRoute(
      async () => {
        throw new Error('must not complete');
      },
      { rateLimited: true }
    );
    const response = await limited.route.GET(request());
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('42');
    const failed = pdfRoute(
      async () => {
        throw new Error('must not complete');
      },
      { renderFails: true }
    );
    expect((await failed.route.GET(request())).status).toBe(500);
    expect(failed.calls.map((call) => call.path)).toEqual([
      'pdf-authorize-public',
    ]);
  });

  test('consumes receipts without consent, blocks mismatched callers and prevents replay', async () => {
    const store = database({
      profiles: [profile],
      pdfDownloadReceipts: [
        {
          _id: 'receipt1',
          receipt: receiptToken,
          profileId: profile._id,
          callerHash,
          expiresAt: Date.now() + 60_000,
        },
      ],
    });
    const complete = pdfModule().completeDownload.handler;
    await complete(
      { db: store.db },
      {
        receipt: receiptToken,
        callerHash: 'b'.repeat(64),
        analyticsConsent: true,
      }
    );
    expect(store.rows('pdfDownloadReceipts')).toHaveLength(1);
    await complete({ db: store.db }, { receipt: receiptToken, callerHash });
    expect(store.rows('pdfDownloadReceipts')).toHaveLength(0);
    await complete(
      { db: store.db },
      { receipt: receiptToken, callerHash, analyticsConsent: true }
    );
    expect(store.rows('profileAnalytics')).toHaveLength(0);
  });

  test('respects expired receipts, disabled analytics and account deletion', async () => {
    for (const state of ['expired', 'disabled', 'deleting']) {
      const store = database({
        profiles: [{ ...profile, analyticsEnabled: state !== 'disabled' }],
        deletionJobs:
          state === 'deleting'
            ? [{ _id: 'deletion1', userId: profile.userId }]
            : [],
        pdfDownloadReceipts: [
          {
            _id: 'receipt1',
            receipt: receiptToken,
            profileId: profile._id,
            callerHash,
            expiresAt: Date.now() + (state === 'expired' ? -60_000 : 60_000),
          },
        ],
      });
      await pdfModule().completeDownload.handler(
        { db: store.db },
        { receipt: receiptToken, callerHash, analyticsConsent: true }
      );
      expect(store.rows('pdfDownloadReceipts')).toHaveLength(0);
      expect(store.rows('profileAnalytics')).toHaveLength(0);
    }
  });

  test('completion failures never break successful PDF downloads', async () => {
    for (const protectedProfile of [false, true]) {
      const { route } = pdfRoute(
        async () => {
          throw new Error('mock completion outage');
        },
        { protectedProfile }
      );
      const response = await route.GET(
        new NextRequest('https://opencv.invalid/api/pdf?username=alice', {
          headers: choiceHeaders('yes'),
        })
      );
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('PDF');
    }
  });
});

describe('browser consent contract', () => {
  function trackerHarness(stored, privacyState = {}) {
    const hooks = [];
    const effects = [];
    const requests = [];
    let cursor = 0;
    const document = {
      cookie: '',
      referrer: 'https://referrer.invalid/private',
    };
    const react = {
      useRef(value) {
        const slot = cursor++;
        return (hooks[slot] ??= { current: value });
      },
      useState(value) {
        const slot = cursor++;
        hooks[slot] ??= { value };
        return [
          hooks[slot].value,
          (next) => {
            hooks[slot].value = next;
          },
        ];
      },
      useEffect(callback, deps) {
        const slot = cursor++;
        if (
          !hooks[slot] ||
          deps.some((value, index) => hooks[slot][index] !== value)
        )
          effects.push(callback);
        hooks[slot] = deps;
      },
    };
    const jsx = (type, props) => ({ type, props });
    const tracker = load(
      'components/analytics-tracker.tsx',
      {
        react,
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/components/ui/button': { buttonVariants: () => '' },
        '@/lib/analytics/consent': consent,
      },
      {
        window: {
          location: new URL(
            'https://opencv.invalid/u/alice?utm_campaign=hello'
          ),
          localStorage: {
            getItem: () => stored,
            setItem: (_key, value) => {
              stored = value;
            },
          },
        },
        document,
        navigator: privacyState,
        queueMicrotask: (callback) => callback(),
        fetch: (path, init) => {
          requests.push({ path, init });
          return Promise.resolve();
        },
      }
    );
    return {
      document,
      requests,
      render() {
        cursor = 0;
        const tree = tracker.AnalyticsTracker({
          profileId: profile._id,
          username: profile.username,
        });
        while (effects.length) effects.shift()();
        return tree;
      },
    };
  }

  test('tracker sends only after Allow and synchronizes its choice for PDF navigation', () => {
    const tracker = trackerHarness(null);
    const prompt = tracker.render();
    expect(tracker.requests).toHaveLength(0);
    prompt.props.children[1].props.children[0].props.onClick();
    tracker.render();
    expect(tracker.requests).toHaveLength(1);
    expect(tracker.requests[0].path).toBe('/api/analytics/event');
    expect(
      consent.analyticsRequestHasConsent(
        new Headers({ cookie: tracker.document.cookie })
      )
    ).toBe(true);
    tracker.render();
    expect(tracker.requests).toHaveLength(1);
  });

  test('tracker respects persisted decline, missing choice, DNT and GPC', () => {
    for (const [stored, privacyState] of [
      ['no', {}],
      [null, {}],
      ['yes', { doNotTrack: '1' }],
      ['yes', { globalPrivacyControl: true }],
    ]) {
      const tracker = trackerHarness(stored, privacyState);
      tracker.render();
      tracker.render();
      expect(tracker.requests).toHaveLength(0);
      expect(
        consent.analyticsRequestHasConsent(
          new Headers({ cookie: tracker.document.cookie })
        )
      ).toBe(false);
    }
  });

  test('explicit cookie choice and browser privacy signals match server interpretation', () => {
    for (const choice of ['yes', 'no', null]) {
      const cookie = consent.analyticsConsentCookie(choice, true);
      expect(cookie).toContain('Path=/; SameSite=Lax;');
      expect(cookie).toContain('; Secure');
      expect(cookie).not.toContain('Domain=');
      for (const privacyState of [
        {},
        { doNotTrack: '1' },
        { globalPrivacyControl: true },
      ]) {
        const headers = new Headers({
          cookie,
          ...(privacyState.doNotTrack ? { dnt: '1' } : {}),
          ...(privacyState.globalPrivacyControl ? { 'sec-gpc': '1' } : {}),
        });
        expect(consent.analyticsRequestHasConsent(headers)).toBe(
          consent.analyticsConsentAllowed(choice, privacyState)
        );
      }
    }
  });
});
