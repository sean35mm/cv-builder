import { describe, expect, test } from 'bun:test';
import { isTestimonialRequestExpired } from '../convex/testimonialExpiry';

describe('isTestimonialRequestExpired', () => {
  test('treats missing expiry as expired', () => {
    expect(isTestimonialRequestExpired(undefined, 1_000)).toBe(true);
  });

  test('treats elapsed and current expiry as expired', () => {
    expect(isTestimonialRequestExpired(999, 1_000)).toBe(true);
    expect(isTestimonialRequestExpired(1_000, 1_000)).toBe(true);
  });

  test('keeps future expiry active', () => {
    expect(isTestimonialRequestExpired(1_001, 1_000)).toBe(false);
  });
});
