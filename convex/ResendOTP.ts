import { Email } from '@convex-dev/auth/providers/Email';
import type { GenericActionCtxWithAuthConfig } from '@convex-dev/auth/server';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { rateLimiter } from './rateLimits';
import { stableRateLimitKey } from './rateLimitKey';
import { normalizeEmail } from './validation';

const hashVerificationCode = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
};

/**
 * Email OTP provider using Resend.
 *
 * Sends a 6-digit numeric code to the user's email.
 * Code expires in 15 minutes.
 *
 * Required env vars (set in Convex dashboard):
 *   AUTH_RESEND_KEY  – Resend API key
 *   AUTH_EMAIL       – (optional) sender address, defaults to onboarding@resend.dev
 */
export const ResendOTP = {
  ...Email({
    async sendVerificationRequest(
      { identifier, token },
      ctx?: GenericActionCtxWithAuthConfig<DataModel>
    ) {
      if (!ctx) throw new Error('Could not send verification email');
      const email = normalizeEmail(identifier);
      let verificationCodeHash: string | undefined;

      try {
        verificationCodeHash = await hashVerificationCode(token);
        const recipientKey = await stableRateLimitKey('otp-recipient', email);
        await rateLimiter.limit(ctx, 'otpSendPerRecipient', {
          key: recipientKey,
          throws: true,
        });
        await rateLimiter.limit(ctx, 'otpSendGlobal', { throws: true });

        const key = process.env.AUTH_RESEND_KEY;
        if (!key) {
          console.error(
            'Missing AUTH_RESEND_KEY environment variable. ' +
              'Set it in your Convex dashboard under Settings → Environment Variables.'
          );
          throw new Error('Could not send verification email');
        }

        const from = process.env.AUTH_EMAIL ?? 'OpenCV <onboarding@resend.dev>';

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [email],
            subject: `${token} is your OpenCV sign-in code`,
            html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
  <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #111;">
    Sign in to OpenCV
  </h2>
  <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
    Enter this code to complete your sign-in:
  </p>
  <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
    <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace; color: #111;">
      ${token}
    </span>
  </div>
  <p style="color: #999; font-size: 12px; line-height: 1.5;">
    This code expires in 15 minutes.<br />
    If you didn&rsquo;t request this, you can safely ignore this email.
  </p>
</div>`.trim(),
          }),
        });

        if (!res.ok) {
          console.error('Resend API error:', res.status);
          throw new Error('Could not send verification email');
        }
      } catch {
        try {
          await ctx.runMutation(internal.auth.cleanupFailedOtpSend, {
            email,
            verificationCodeHash,
          });
        } catch {
          // Preserve the generic delivery error if best-effort cleanup fails.
        }
        throw new Error('Could not send verification email');
      }
    },
  }),

  // Override defaults from Email() helper:
  maxAge: 15 * 60, // 15 minutes (default is 1 hour)

  normalizeIdentifier(identifier: string) {
    return normalizeEmail(identifier);
  },

  async generateVerificationToken() {
    return generateRandomString(6, alphabet('0-9'));
  },
};
