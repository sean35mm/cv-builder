import { describe, expect, test } from 'bun:test';
import { Algorithm, Version, hash, verify } from '@node-rs/argon2';
import { DUMMY_PROFILE_PASSCODE_HASH } from '../lib/profile/argon-contract';
import { hmacProfilePasscode } from '../lib/profile/passcode-hmac';
import {
  isProfilePasscodeHash,
  normalizeProfilePasscode,
} from '../lib/profile/passcode-policy';
import {
  encodeGrantCookie,
  grantCookieOptions,
  grantTokenForUsername,
  parseGrantCookie,
} from '../lib/profile/grant-cookie';
import {
  isSameOriginJsonPost,
  isSameOriginMultipartPost,
  MAX_MULTIPART_IMAGE_REQUEST_BYTES,
} from '../lib/profile/request-security';

describe('passcode security contracts', () => {
  test('normalizes NFC without trimming and rejects invalid code points', () => {
    expect(normalizeProfilePasscode(`  Cafe\u0301 pass  `)).toBe(
      `  Café pass  `
    );
    expect(() => normalizeProfilePasscode('short')).toThrow('Passcode is invalid');
    expect(() => normalizeProfilePasscode('valid pass\ncode')).toThrow(
      'Passcode is invalid'
    );
    expect(() => normalizeProfilePasscode('x'.repeat(129))).toThrow(
      'Passcode is invalid'
    );
  });

  test('uses the approved Argon2id PHC contract without embedding input', async () => {
    const rawPasscode = '  Café pass  ';
    const digest = hmacProfilePasscode(rawPasscode, 'p'.repeat(32));
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain(rawPasscode);
    expect(
      hmacProfilePasscode(`  Cafe\u0301 pass  `, 'p'.repeat(32))
    ).toBe(digest);
    expect(hmacProfilePasscode('Café pass  ', 'p'.repeat(32))).not.toBe(digest);
    const encoded = await hash(digest, {
      algorithm: Algorithm.Argon2id,
      version: Version.V0x13,
      memoryCost: 64 * 1024,
      timeCost: 3,
      parallelism: 1,
      outputLen: 32,
      salt: new Uint8Array(16),
    });
    expect(isProfilePasscodeHash(encoded)).toBe(true);
    expect(await verify(encoded, digest)).toBe(true);
    expect(encoded).not.toContain(digest);
    expect(isProfilePasscodeHash(DUMMY_PROFILE_PASSCODE_HASH)).toBe(true);
    expect(isProfilePasscodeHash('$argon2id$malformed')).toBe(false);
  });

  test('accepts only the scoped opaque grant cookie format', () => {
    const token = 'A'.repeat(43);
    const encoded = encodeGrantCookie('Alice', token);
    expect(parseGrantCookie(encoded)).toEqual({ username: 'alice', token });
    expect(grantTokenForUsername(encoded, 'ALICE')).toBe(token);
    expect(grantTokenForUsername(encoded, 'bob')).toBeUndefined();
    expect(parseGrantCookie(`alice.${'A'.repeat(42)}`)).toBeNull();
    expect(grantCookieOptions(Date.now() + 1000)).not.toHaveProperty('domain');
  });

  test('requires JSON POST requests from the same origin', () => {
    const valid = new Request('https://example.com/api/profile-access/unlock', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        host: 'example.com',
        origin: 'https://example.com',
        'sec-fetch-site': 'same-origin',
      },
      body: '{}',
    });
    expect(isSameOriginJsonPost(valid)).toBe(true);
    expect(
      isSameOriginJsonPost(
        new Request(valid.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            host: 'example.com',
            origin: 'https://attacker.example',
          },
          body: '{}',
        })
      )
    ).toBe(false);
  });

  test('requires bounded same-origin multipart image requests with a boundary', () => {
    const request = (headers = {}, method = 'POST') =>
      new Request('https://example.com/api/uploads/images', {
        method,
        headers: {
          'content-length': '1024',
          'content-type': 'multipart/form-data; boundary=upload-boundary',
          host: 'example.com',
          origin: 'https://example.com',
          'sec-fetch-site': 'same-origin',
          ...headers,
        },
        ...(method === 'POST' ? { body: new Uint8Array([1]) } : {}),
      });
    expect(isSameOriginMultipartPost(request())).toBe(true);
    expect(
      isSameOriginMultipartPost(request({ 'content-type': 'multipart/form-data' }))
    ).toBe(false);
    expect(
      isSameOriginMultipartPost(
        request({
          'content-length': String(MAX_MULTIPART_IMAGE_REQUEST_BYTES + 1),
        })
      )
    ).toBe(false);
    expect(
      isSameOriginMultipartPost(request({ origin: 'https://attacker.example' }))
    ).toBe(false);
    expect(isSameOriginMultipartPost(request({}, 'GET'))).toBe(false);
  });
});
