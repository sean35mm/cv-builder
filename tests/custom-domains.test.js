import { afterEach, describe, expect, mock, test } from 'bun:test';
import {
  normalizeCustomDomain,
  parseReservedHostList,
} from '../lib/custom-domains/domain-policy';
import {
  classifyRequestHost,
  hasSingleHostHeaderValue,
  isAllowedCustomHostPath,
  parseAuthority,
  parseSiteOrigin,
} from '../lib/custom-domains/host-routing';
import {
  accountDeletionCustomDomainPolicy,
  canTransitionCustomDomain,
  customDomainRoutesPublicly,
  deletionCanAdvancePastCustomDomain,
  operationIsCurrent,
} from '../lib/custom-domains/lifecycle';
import {
  customDomainCanonicalUrl,
  customDomainRobots,
  profileCanonicalUrl,
} from '../lib/custom-domains/access-metadata';
import {
  addVercelDomain,
  getVercelDomain,
  removeVercelDomain,
  VercelProviderError,
} from '../lib/custom-domains/vercel-adapter';
import { txtRecordsContainExactProof } from '../lib/custom-domains/dns-proof';

mock.module('server-only', () => ({}));
const { getHostRoutingConfig } =
  await import('../lib/custom-domains/server-config');

const originalHostRoutingEnv = {
  CUSTOM_DOMAINS_ENABLED: process.env.CUSTOM_DOMAINS_ENABLED,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  PLATFORM_HOSTS: process.env.PLATFORM_HOSTS,
};

afterEach(() => {
  for (const [name, value] of Object.entries(originalHostRoutingEnv)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe('custom domain policy', () => {
  test('normalizes strict IDNA hostnames using the ICANN suffix list', () => {
    expect(normalizeCustomDomain('BÜCHER.de')).toEqual({
      hostname: 'xn--bcher-kva.de',
      displayHostname: 'bücher.de',
      registrableDomain: 'xn--bcher-kva.de',
    });
    expect(normalizeCustomDomain('Portfolio.Example.COM.').hostname).toBe(
      'portfolio.example.com'
    );
  });

  test('rejects non-host inputs, unknown suffixes, bare suffixes, IPs and reserved infrastructure', () => {
    for (const value of [
      'https://example.com',
      'user@example.com',
      'example.com/path',
      'example.com:443',
      '*.example.com',
      '127.0.0.1',
      'localhost',
      'singlelabel',
      'com',
      'example.invalidsuffix',
      'tenant.vercel.app',
    ]) {
      expect(() => normalizeCustomDomain(value)).toThrow();
    }
    expect(() =>
      normalizeCustomDomain('app.example.com', ['example.com'])
    ).toThrow('DOMAIN_RESERVED');
    expect(parseReservedHostList('a.example, b.example')).toEqual([
      'a.example',
      'b.example',
    ]);
  });
});

describe('custom host routing', () => {
  const config = {
    enabled: true,
    platformAuthorities: new Set(['app.example.com', 'localhost:3000']),
  };

  test('classifies only exact platform authorities and safe custom hosts', () => {
    expect(classifyRequestHost('app.example.com', config).kind).toBe(
      'platform'
    );
    expect(classifyRequestHost('preview.vercel.app', config).kind).toBe(
      'custom'
    );
    expect(classifyRequestHost('localhost:3000', config).kind).toBe('platform');
    expect(classifyRequestHost('customer.example:443', config).kind).toBe(
      'invalid'
    );
    expect(classifyRequestHost('a.example,b.example', config).kind).toBe(
      'invalid'
    );
    expect(parseAuthority('user@a.example')).toBeNull();
    expect(
      hasSingleHostHeaderValue(new Headers({ host: 'a.example,b.example' }))
    ).toBe(false);
    expect(
      classifyRequestHost('customer.example', { ...config, enabled: false })
        .kind
    ).toBe('invalid');
  });

  test('accepts both apex and www variants of the configured site host', () => {
    process.env.CUSTOM_DOMAINS_ENABLED = 'false';
    delete process.env.PLATFORM_HOSTS;

    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.Example.com.:04443';
    const wwwConfig = getHostRoutingConfig();
    expect(classifyRequestHost('example.com:4443', wwwConfig).kind).toBe(
      'platform'
    );

    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    const apexConfig = getHostRoutingConfig();
    expect(classifyRequestHost('WWW.EXAMPLE.COM.', apexConfig).kind).toBe(
      'platform'
    );
  });

  test('preserves explicit platform hosts without trusting unknown hosts', () => {
    process.env.CUSTOM_DOMAINS_ENABLED = 'false';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    process.env.PLATFORM_HOSTS = 'Assets.Example.com.:0443';
    const configured = getHostRoutingConfig();

    expect(classifyRequestHost('assets.example.com:443', configured).kind).toBe(
      'platform'
    );
    expect(classifyRequestHost('unknown.example.com', configured).kind).toBe(
      'invalid'
    );
    expect(classifyRequestHost('preview.vercel.app', configured).kind).toBe(
      'invalid'
    );
  });

  test('accepts only credential-free site origins', () => {
    expect(parseSiteOrigin('https://app.example.com').origin).toBe(
      'https://app.example.com'
    );
    for (const value of [
      'https://user:pass@app.example.com',
      'https://app.example.com/path',
      'https://app.example.com?query=1',
      'https://app.example.com/#fragment',
      'https://*.vercel.app',
      'file:///tmp/app',
    ]) {
      expect(() => parseSiteOrigin(value)).toThrow();
    }
  });

  test('allows only profile runtime paths on customer hosts', () => {
    for (const path of [
      '/',
      '/_next/static/app.js',
      '/api/pdf',
      '/api/storage/abc',
      '/api/profile-access/unlock',
      '/api/profile-access/lock',
      '/api/profile-access/event',
      '/api/profile-access/contact',
    ]) {
      expect(isAllowedCustomHostPath(path)).toBe(true);
    }
    for (const path of [
      '/editor',
      '/domains',
      '/api/uploads/images',
      '/api/profile-access/configure',
      '/api/profile-access/revoke',
      '/api/arbitrary',
    ]) {
      expect(isAllowedCustomHostPath(path)).toBe(false);
    }
  });
});

describe('custom domain lifecycle and metadata', () => {
  test('rejects stale completions and keeps tombstones blocking deletion progression', () => {
    expect(
      operationIsCurrent(
        { revision: 3, operationId: 'current' },
        { revision: 2, operationId: 'old' }
      )
    ).toBe(false);
    expect(canTransitionCustomDomain('pending_dns', 'active')).toBe(false);
    expect(canTransitionCustomDomain('removing', 'removed')).toBe(true);
    expect(
      customDomainRoutesPublicly({ status: 'active', desiredState: 'attached' })
    ).toBe(true);
    expect(
      customDomainRoutesPublicly({ status: 'active', desiredState: 'detached' })
    ).toBe(false);
    expect(
      deletionCanAdvancePastCustomDomain({ status: 'remove_failed' })
    ).toBe(false);
    expect(deletionCanAdvancePastCustomDomain({ status: 'removed' })).toBe(
      true
    );
    expect(accountDeletionCustomDomainPolicy(null)).toBe('advance');
    expect(accountDeletionCustomDomainPolicy({ status: 'active' })).toBe(
      'remove'
    );
    expect(accountDeletionCustomDomainPolicy({ status: 'removed' })).toBe(
      'delete'
    );
  });

  test('uses absolute custom canonical URLs and generic noindex metadata for protected access', () => {
    expect(customDomainCanonicalUrl('cv.example.com')).toBe(
      'https://cv.example.com/'
    );
    expect(
      profileCanonicalUrl('https://app.example.com', 'alice', 'cv.example.com')
    ).toBe('https://cv.example.com/');
    expect(profileCanonicalUrl('https://app.example.com', 'alice')).toBe(
      'https://app.example.com/@alice'
    );
    expect(customDomainRobots('passcode')).toEqual({
      index: false,
      follow: false,
      nocache: true,
    });
  });

  test('requires an exact complete TXT proof value', () => {
    expect(
      txtRecordsContainExactProof(
        [['opencv-domain-', 'verification=abc']],
        'opencv-domain-verification=abc'
      )
    ).toBe(true);
    expect(
      txtRecordsContainExactProof(
        [['prefix opencv-domain-verification=abc']],
        'opencv-domain-verification=abc'
      )
    ).toBe(false);
  });
});

describe('Vercel adapter', () => {
  const config = (fetchImpl) => ({
    token: 'secret-token',
    projectId: 'project/id',
    teamId: 'team id',
    timeoutMs: 10,
    fetchImpl,
  });

  test('uses pinned versioned, encoded project/domain endpoints with team scope', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          name: 'cv.example.com',
          verified: true,
          misconfigured: false,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    };
    expect(await addVercelDomain(config(fetchImpl), 'cv.example.com')).toEqual({
      exists: true,
      verified: true,
      configured: true,
    });
    expect(calls[0].url).toBe(
      'https://api.vercel.com/v10/projects/project%2Fid/domains?teamId=team+id'
    );
    expect(calls[1].url).toBe(
      'https://api.vercel.com/v9/projects/project%2Fid/domains/cv.example.com?teamId=team+id'
    );
    expect(calls[0].init.headers.Authorization).toBe('Bearer secret-token');
  });

  test('treats delete 404 as absent and strictly decodes bounded responses', async () => {
    const absent = await removeVercelDomain(
      config(async () => new Response('{}', { status: 404 })),
      'cv.example.com'
    );
    expect(absent).toBe(true);
    await expect(
      getVercelDomain(
        config(
          async () =>
            new Response(
              JSON.stringify({
                name: 'other.example',
                verified: true,
                misconfigured: false,
              })
            )
        ),
        'cv.example.com'
      )
    ).rejects.toMatchObject({ code: 'PROVIDER_RESPONSE_INVALID' });
  });

  test('times out generically without exposing credentials or provider bodies', async () => {
    const fetchImpl = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () =>
          reject(new Error('secret provider body'))
        );
      });
    try {
      await getVercelDomain(config(fetchImpl), 'cv.example.com');
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(VercelProviderError);
      expect(error.code).toBe('PROVIDER_TIMEOUT');
      expect(error.message).not.toContain('secret-token');
      expect(error.message).not.toContain('provider body');
    }
  });
});
