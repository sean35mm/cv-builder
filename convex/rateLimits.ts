import { DAY, HOUR, MINUTE, RateLimiter } from '@convex-dev/rate-limiter';
import { components } from './_generated/api';
import { PROFILE_CONFIGURE_LIMITS } from '../lib/profile/configure-limit-policy';

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  aiGlobal: {
    kind: 'fixed window',
    rate: 100,
    period: MINUTE,
  },
  aiPerUser: {
    kind: 'fixed window',
    rate: 10,
    period: DAY,
  },
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
  customDomainPerUser: {
    kind: 'fixed window',
    rate: 10,
    period: HOUR,
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
  passcodeUnlockPerCallerProfile: {
    kind: 'fixed window',
    rate: 5,
    period: 15 * MINUTE,
  },
  passcodeUnlockPerProfile: {
    kind: 'fixed window',
    rate: 30,
    period: HOUR,
  },
  passcodeUnlockGlobal: {
    kind: 'fixed window',
    rate: 100,
    period: MINUTE,
  },
  profileConfigureGlobal: {
    kind: 'fixed window',
    rate: PROFILE_CONFIGURE_LIMITS.global.rate,
    period: PROFILE_CONFIGURE_LIMITS.global.periodMs,
  },
  profileConfigurePerUserProfile: {
    kind: 'fixed window',
    rate: PROFILE_CONFIGURE_LIMITS.perUserProfile.rate,
    period: PROFILE_CONFIGURE_LIMITS.perUserProfile.periodMs,
  },
});
