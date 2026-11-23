import { ConvexError, v } from 'convex/values';
import { OTP_CHALLENGE_FAILED } from '../lib/auth/otp-send-error';
import { internal } from './_generated/api';
import {
  action,
  internalMutation,
  type MutationCtx,
} from './_generated/server';
import { assertOtpRecipientAllowed, canonicalOtpEmail } from './otpRecipient';
import { stableRateLimitKey } from './rateLimitKey';
import { normalizeEmail } from './validation';

// Convex Auth's signIn action is public on *.convex.cloud and does not pass
// extra params to createOrUpdateUser, so the bot check runs here first. A
// verified Turnstile token buys one short-lived, single-use pass for one
// address, and admitOtpSend consumes it inside the code-send mutation.

export const TURNSTILE_SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const OTP_CHALLENGE_PASS_TTL_MS = 10 * 60 * 1000;
// Cloudflare documents a 2048-character maximum token length.
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const MAX_PASSES_PER_KEY = 10;
const EXPIRED_PASS_SWEEP_LIMIT = 25;

/** Enforcement is off until TURNSTILE_SECRET_KEY is set. */
export function turnstileSecret(): string | undefined {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || undefined;
}

export function warnTurnstileDisabled(): void {
  console.warn(
    'TURNSTILE_SECRET_KEY is not set: email sign-in codes are sent without a bot check.'
  );
}

export type TurnstileVerification =
  | { ok: true }
  | {
      ok: false;
      reason: 'invalid' | 'rejected' | 'unavailable';
      errorCodes: string[];
    };

export async function verifyTurnstileToken(
  secret: string,
  token: string,
  fetchImpl: typeof fetch = fetch
): Promise<TurnstileVerification> {
  if (!token || token.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    return { ok: false, reason: 'invalid', errorCodes: [] };
  }

  let response: Response;
  try {
    response = await fetchImpl(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });
  } catch {
    return { ok: false, reason: 'unavailable', errorCodes: [] };
  }
  if (!response.ok) {
    return {
      ok: false,
      reason: 'unavailable',
      errorCodes: [`http-${response.status}`],
    };
  }

  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== 'object' || body === null) {
    return { ok: false, reason: 'unavailable', errorCodes: [] };
  }
  if ('success' in body && body.success === true) return { ok: true };
  const errorCodes =
    'error-codes' in body && Array.isArray(body['error-codes'])
      ? body['error-codes'].filter(
          (code): code is string => typeof code === 'string'
        )
      : [];
  return { ok: false, reason: 'rejected', errorCodes };
}

/** Pass key for an address already passed through normalizeEmail. */
export function otpChallengeKey(email: string): Promise<string> {
  return stableRateLimitKey('otp-challenge', canonicalOtpEmail(email));
}

type PassDb = Pick<MutationCtx['db'], 'delete' | 'insert' | 'query'>;

/**
 * Stores one pass for the key, replacing any earlier one, and deletes a
 * bounded batch of expired passes so unused ones do not pile up.
 */
export async function issueOtpChallengePass(
  db: PassDb,
  key: string,
  now: number
): Promise<void> {
  const existing = await db
    .query('otpChallengePasses')
    .withIndex('by_key', (q) => q.eq('key', key))
    .take(MAX_PASSES_PER_KEY);
  for (const pass of existing) await db.delete(pass._id);

  await db.insert('otpChallengePasses', {
    key,
    expiresAt: now + OTP_CHALLENGE_PASS_TTL_MS,
  });

  const expired = await db
    .query('otpChallengePasses')
    .withIndex('by_expiration', (q) => q.lt('expiresAt', now))
    .take(EXPIRED_PASS_SWEEP_LIMIT);
  for (const pass of expired) await db.delete(pass._id);
}

/**
 * Deletes every pass for the key and reports whether one was still valid. A
 * caller that throws afterwards rolls the deletion back with its mutation.
 */
export async function consumeOtpChallengePass(
  db: PassDb,
  key: string,
  now: number
): Promise<boolean> {
  const passes = await db
    .query('otpChallengePasses')
    .withIndex('by_key', (q) => q.eq('key', key))
    .take(MAX_PASSES_PER_KEY);
  let valid = false;
  for (const pass of passes) {
    if (pass.expiresAt > now) valid = true;
    await db.delete(pass._id);
  }
  return valid;
}

export const requestOtpChallengePass = action({
  args: { email: v.string(), turnstileToken: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    assertOtpRecipientAllowed(email);

    const secret = turnstileSecret();
    if (!secret) {
      warnTurnstileDisabled();
      return null;
    }

    const result = await verifyTurnstileToken(secret, args.turnstileToken);
    if (!result.ok) {
      console.warn(
        'Turnstile verification failed:',
        result.reason,
        result.errorCodes.join(',')
      );
      throw new ConvexError({ kind: OTP_CHALLENGE_FAILED });
    }

    await ctx.runMutation(internal.otpChallenge.storeOtpChallengePass, {
      key: await otpChallengeKey(email),
    });
    return null;
  },
});

export const storeOtpChallengePass = internalMutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await issueOtpChallengePass(ctx.db, args.key, Date.now());
    return null;
  },
});
