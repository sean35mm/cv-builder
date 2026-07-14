import { DAY, HOUR, MINUTE, RateLimiter } from '@convex-dev/rate-limiter';
import { components } from './_generated/api';

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  analyticsEvent: {
    kind: 'token bucket',
    rate: 300,
    period: MINUTE,
    capacity: 300,
  },
  contactPerProfile: {
    kind: 'fixed window',
    rate: 30,
    period: HOUR,
  },
  contactPerSenderProfile: {
    kind: 'token bucket',
    rate: 3,
    period: HOUR,
    capacity: 3,
  },
  otpSendGlobal: {
    kind: 'fixed window',
    rate: 100,
    period: MINUTE,
  },
  otpSendPerRecipient: {
    kind: 'token bucket',
    rate: 5,
    period: HOUR,
    capacity: 3,
  },
  testimonialRequestPerUser: {
    kind: 'fixed window',
    rate: 10,
    period: DAY,
  },
  testimonialSubmissionPerToken: {
    kind: 'fixed window',
    rate: 5,
    period: HOUR,
  },
  uploadSessionPerUser: {
    kind: 'token bucket',
    rate: 10,
    period: HOUR,
    capacity: 3,
  },
  uploadFinalizationPerUser: {
    kind: 'token bucket',
    rate: 20,
    period: HOUR,
    capacity: 5,
  },
  pdfPerCaller: {
    kind: 'token bucket',
    rate: 10,
    period: MINUTE,
    capacity: 5,
  },
  pdfPerProfile: {
    kind: 'fixed window',
    rate: 60,
    period: MINUTE,
  },
});
