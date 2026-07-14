import { describe, expect, test } from 'bun:test';
import { trustedCallerAddress } from '../lib/pdf/trusted-ip-header';

describe('trustedCallerAddress', () => {
  test('does not trust unsupported headers without configuration', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.8' });

    expect(trustedCallerAddress(headers, {})).toBeUndefined();
  });

  test('accepts a valid address from a configured trusted header', () => {
    const headers = new Headers({
      'x-trusted-client-ip': '203.0.113.8, 198.51.100.1',
    });

    expect(
      trustedCallerAddress(headers, {
        trustedIpHeader: ' X-Trusted-Client-IP ',
      })
    ).toBe('203.0.113.8');
  });

  test('rejects invalid IP values from a trusted header', () => {
    const headers = new Headers({ 'x-trusted-client-ip': 'not-an-ip' });

    expect(
      trustedCallerAddress(headers, {
        trustedIpHeader: 'x-trusted-client-ip',
      })
    ).toBeUndefined();
  });
});
