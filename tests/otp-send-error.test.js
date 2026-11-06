import { describe, expect, test } from 'bun:test';
import { ConvexError } from 'convex/values';
import {
  classifyOtpSendError,
  describeRetryWait,
  formatRetryWait,
  OTP_DELIVERY_FAILED,
} from '../lib/auth/otp-send-error';

describe('classifyOtpSendError', () => {
  test('reads the rate limiter retry delay in whole seconds', () => {
    expect(
      classifyOtpSendError(
        new ConvexError({
          kind: 'RateLimited',
          name: 'otpSendPerRecipient',
          retryAfter: 700_400,
        })
      )
    ).toEqual({ kind: 'rateLimited', retryAfterSeconds: 701 });
  });

  test('falls back to a minute when the delay is missing', () => {
    expect(
      classifyOtpSendError(new ConvexError({ kind: 'RateLimited' }))
    ).toEqual({ kind: 'rateLimited', retryAfterSeconds: 60 });
  });

  test('recognizes a failed delivery', () => {
    expect(
      classifyOtpSendError(new ConvexError({ kind: OTP_DELIVERY_FAILED }))
    ).toEqual({ kind: 'deliveryFailed' });
  });

  test.each([false, true])(
    'recognizes the message-only Next auth transport, wrapped=%s',
    (wrapped) => {
      // Installed auth/nextjs/server/proxy.ts serializes {error: error.message};
      // auth/nextjs/client.tsx then throws new Error(response.error).
      const transport = (data) => {
        const source = new ConvexError(data);
        const message = wrapped
          ? `[Request ID: test] Server Error\nUncaught ConvexError: ${source.message}\n    at handler (test.ts:1:1)`
          : source.message;
        return new Error(JSON.parse(JSON.stringify({ error: message })).error);
      };
      const rateError = transport({
        kind: 'RateLimited',
        name: 'otpSendPerRecipient',
        retryAfter: 700_400,
      });
      expect(rateError.data).toBeUndefined();
      expect(classifyOtpSendError(rateError)).toEqual({
        kind: 'rateLimited',
        retryAfterSeconds: 701,
      });
      expect(
        classifyOtpSendError(transport({ kind: OTP_DELIVERY_FAILED }))
      ).toEqual({ kind: 'deliveryFailed' });
    }
  );

  test.each([
    'Uncaught ConvexError: {broken}',
    'RateLimited',
    '{"kind":"other"}',
    'x'.repeat(16_385),
  ])('rejects malformed or unrelated transport messages', (message) => {
    expect(classifyOtpSendError(new Error(message))).toEqual({
      kind: 'unknown',
    });
  });

  test('treats anything else as unknown', () => {
    expect(classifyOtpSendError(new Error('Server Error'))).toEqual({
      kind: 'unknown',
    });
    expect(classifyOtpSendError(new ConvexError('RateLimited'))).toEqual({
      kind: 'unknown',
    });
    expect(classifyOtpSendError(null)).toEqual({ kind: 'unknown' });
  });
});

describe('retry wait formatting', () => {
  test('formats the resend countdown', () => {
    expect(formatRetryWait(30)).toBe('30s');
    expect(formatRetryWait(701)).toBe('11:41');
    expect(formatRetryWait(60)).toBe('1:00');
  });

  test('describes the wait in words', () => {
    expect(describeRetryWait(45)).toBe('less than a minute');
    expect(describeRetryWait(60)).toBe('about 1 minute');
    expect(describeRetryWait(701)).toBe('about 12 minutes');
  });
});
