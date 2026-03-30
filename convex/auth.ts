import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth, getAuthUserId } from '@convex-dev/auth/server';
import { query } from './_generated/server';
import { ResendOTP } from './ResendOTP';

type PasswordProfileParams = {
  email?: unknown;
};

const isPasswordProfileParams = (
  value: unknown
): value is PasswordProfileParams =>
  typeof value === 'object' && value !== null && 'email' in value;

const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Primary: passwordless email OTP via Resend
    ResendOTP,
    // Fallback: email + password
    Password({
      profile: (params: unknown) => {
        const rawEmail =
          isPasswordProfileParams(params) && typeof params.email === 'string'
            ? params.email
            : '';
        return { email: normalizeEmail(rawEmail) };
      },
    }),
  ],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
