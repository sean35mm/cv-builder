import { describe, expect, test } from 'bun:test';
import { stableRateLimitKey } from '../convex/rateLimitKey';

describe('stableRateLimitKey', () => {
  test('is deterministic and does not expose the raw value', async () => {
    const email = 'private@example.com';
    const first = await stableRateLimitKey('otp-email', email);
    const second = await stableRateLimitKey('otp-email', email);

    expect(first).toBe(second);
    expect(first).toMatch(/^otp-email:[a-f0-9]{64}$/);
    expect(first).not.toContain(email);
  });

  test('separates namespaces for the same secret', async () => {
    const token = 'private-testimonial-token';
    const emailKey = await stableRateLimitKey('otp-email', token);
    const tokenKey = await stableRateLimitKey('testimonial-token', token);

    expect(emailKey).not.toBe(tokenKey);
    expect(emailKey).not.toContain(token);
    expect(tokenKey).not.toContain(token);
  });

  test('rejects empty and oversized inputs', async () => {
    await expect(stableRateLimitKey('', 'value')).rejects.toThrow();
    await expect(stableRateLimitKey('namespace', '')).rejects.toThrow();
    await expect(stableRateLimitKey('n'.repeat(65), 'value')).rejects.toThrow();
    await expect(stableRateLimitKey('namespace', 'v'.repeat(513))).rejects.toThrow();
  });
});
