import { describe, expect, test } from 'bun:test';
import { generateNumericOtp } from '../convex/ResendOTP';

describe('Resend OTP generation', () => {
  test('always returns exactly six ASCII digits', () => {
    for (let index = 0; index < 100; index += 1) {
      expect(generateNumericOtp()).toMatch(/^[0-9]{6}$/);
    }
  });

  test('does not repeat one value across a batch', () => {
    const codes = new Set(
      Array.from({ length: 32 }, () => generateNumericOtp())
    );

    expect(codes.size).toBeGreaterThan(1);
  });
});
