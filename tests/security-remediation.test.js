import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  PRIVATE_NO_STORE_HEADERS,
  privateNoStoreNotFoundResponse,
  readBoundedJson,
} from '../lib/profile/request-security';

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('bounded JSON request parsing', () => {
  test('rejects oversized declared bodies before parsing', async () => {
    const request = new Request('https://app.example/api', {
      method: 'POST',
      headers: { 'content-length': '33' },
      body: '{}',
    });
    await expect(readBoundedJson(request, 32)).rejects.toThrow(
      'Invalid request'
    );
  });

  test('rejects chunked bodies that cross the hard limit', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"value":"'));
        controller.enqueue(new TextEncoder().encode('x'.repeat(32)));
        controller.enqueue(new TextEncoder().encode('"}'));
        controller.close();
      },
    });
    const request = new Request('https://app.example/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: stream,
    });
    await expect(readBoundedJson(request, 32)).rejects.toThrow(
      'Invalid request'
    );
  });

  test('rejects malformed JSON and returns valid JSON', async () => {
    await expect(
      readBoundedJson(
        new Request('https://app.example/api', {
          method: 'POST',
          body: '{invalid',
        })
      )
    ).rejects.toThrow('Invalid request');
    await expect(
      readBoundedJson(
        new Request('https://app.example/api', {
          method: 'POST',
          body: JSON.stringify({ ok: true }),
        })
      )
    ).resolves.toEqual({ ok: true });
  });
});

describe('customer-host denial contract', () => {
  test('returns one empty private no-store 404 response contract', async () => {
    const first = privateNoStoreNotFoundResponse();
    const second = privateNoStoreNotFoundResponse();
    expect(first.status).toBe(404);
    expect(await first.text()).toBe('');
    expect([...first.headers]).toEqual([...second.headers]);
    for (const [name, value] of Object.entries(PRIVATE_NO_STORE_HEADERS)) {
      expect(second.headers.get(name)).toBe(value);
    }
  });

  test('uses the shared response in every customer-host API', () => {
    for (const path of [
      'app/api/pdf/route.ts',
      'app/api/storage/[storageId]/route.ts',
      'app/api/profile-access/unlock/route.ts',
      'app/api/profile-access/lock/route.ts',
      'app/api/profile-access/contact/route.ts',
      'app/api/profile-access/event/route.ts',
    ]) {
      expect(source(path)).toContain('privateNoStoreNotFoundResponse');
    }
  });
});

describe('security remediation wiring', () => {
  test('bounded-parses every external JSON route before decoding', () => {
    for (const path of [
      'app/api/profile-access/unlock/route.ts',
      'app/api/profile-access/event/route.ts',
      'app/api/profile-access/contact/route.ts',
      'app/api/profile-access/configure/route.ts',
      'app/api/profile-access/revoke/route.ts',
      'convex/profileAccessHttp.ts',
    ]) {
      const contents = source(path);
      expect(contents).toContain('readBoundedJson');
      expect(contents).not.toMatch(/request\.(?:json|text)\(/);
    }
  });

  test('keeps localized rendering data out of protected PDF authorization', () => {
    const route = source('app/api/pdf/route.ts');
    const access = source('convex/profileAccess.ts');
    const accessHttp = source('convex/profileAccessHttp.ts');
    const http = source('convex/http.ts');
    const authorizationIndex = route.indexOf("'pdf-authorize'");
    const bundleIndex = route.indexOf("'bundle'", authorizationIndex);
    const authorizationRequest = route.slice(authorizationIndex, bundleIndex);
    const bundleRequest = route.slice(
      bundleIndex,
      route.indexOf('if (!bundleResponse.ok')
    );
    const protectedAuthorization = access.slice(
      access.indexOf('export const authorizeProtectedPdf'),
      access.indexOf('export const beginUnlock')
    );
    const protectedHttpAuthorization = accessHttp.slice(
      accessHttp.indexOf('export const authorizeProtectedPdf'),
      accessHttp.indexOf('export const authorizePublicPdf')
    );

    expect(authorizationIndex).toBeGreaterThan(-1);
    expect(bundleIndex).toBeGreaterThan(authorizationIndex);
    expect(authorizationRequest).not.toContain('{ locale }');
    expect(bundleRequest).toContain('{ locale }');
    expect(protectedHttpAuthorization).toContain(
      "!hasFields(body, ['username'], ['token', 'ownerProfileId'])"
    );
    expect(protectedAuthorization).toContain(
      "rateLimiter.limit(ctx, 'pdfPerProfile'"
    );
    expect(http).toContain("path: '/profile-access/pdf-authorize'");
    expect(route.match(/eventType: 'pdf_download'/g)).toHaveLength(1);
  });

  test('keeps expired-grant cleanup bounded but unscheduled', () => {
    const access = source('convex/profileAccess.ts');
    const crons = source('convex/crons.ts');
    const cleanup = access.slice(
      access.indexOf('export const cleanupExpiredGrants')
    );
    expect(cleanup).toContain("withIndex('by_expiration'");
    expect(cleanup).toContain('.take(EXPIRED_GRANT_CLEANUP_LIMIT)');
    expect(crons).not.toContain('internal.profileAccess.cleanupExpiredGrants');
  });
});
