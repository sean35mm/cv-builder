import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth, getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { internalMutation, query, type MutationCtx } from './_generated/server';
import { ResendOTP } from './ResendOTP';
import {
  ACCOUNT_MATCH_ERROR,
  selectAuthLinkingDecision,
} from './authLinking';
import { isFailedOtpCleanupEligible } from './authCleanup';
import { ensureAccountActive } from './deletion';
import { normalizeEmail } from './validation';

type PasswordProfileParams = {
  email?: unknown;
  flow?: unknown;
};

const isPasswordProfileParams = (
  value: unknown
): value is PasswordProfileParams =>
  typeof value === 'object' && value !== null && 'email' in value;

const MAX_EMAIL_MATCHES = 20;

const authUserValidator = v.object({
  _id: v.id('users'),
  _creationTime: v.number(),
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Primary: passwordless email OTP via Resend
    ResendOTP,
    // Fallback: email + password
    Password({
      profile: (params: unknown) => {
        if (!isPasswordProfileParams(params) || params.flow !== 'signIn') {
          throw new Error('Password sign-up is disabled. Continue with email.');
        }
        const rawEmail = typeof params.email === 'string' ? params.email : '';
        return { email: normalizeEmail(rawEmail) };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const db = ctx.db as MutationCtx['db'];
      const rawEmail = args.profile.email;
      const email =
        typeof rawEmail === 'string' ? normalizeEmail(rawEmail) : undefined;
      const isVerifiedEmailFlow =
        args.type === 'verification' &&
        args.profile.emailVerified === true &&
        email !== undefined;

      if (args.type === 'credentials') {
        throw new Error('Password sign-up is disabled. Continue with email.');
      }

      if (args.existingUserId) {
        if (!isVerifiedEmailFlow) return args.existingUserId;

        const account = await db
          .query('authAccounts')
          .withIndex('providerAndAccountId', (q) =>
            q.eq('provider', args.provider.id).eq('providerAccountId', email)
          )
          .unique();
        const matchingUsers = await db
          .query('users')
          .withIndex('email', (q) => q.eq('email', email))
          .take(MAX_EMAIL_MATCHES + 1);
        if (matchingUsers.length > MAX_EMAIL_MATCHES) {
          throw new Error(ACCOUNT_MATCH_ERROR);
        }
        const matchingPasswordAccounts = await db
          .query('authAccounts')
          .withIndex('providerAndAccountId', (q) =>
            q.eq('provider', 'password').eq('providerAccountId', email)
          )
          .take(2);
        if (matchingPasswordAccounts.length > 1) {
          throw new Error(ACCOUNT_MATCH_ERROR);
        }
        const existingUser = await db.get(args.existingUserId);
        if (!existingUser) throw new Error(ACCOUNT_MATCH_ERROR);
        const passwordUser = matchingPasswordAccounts[0]
          ? await db.get(matchingPasswordAccounts[0].userId)
          : null;
        const users = [
          existingUser,
          ...(passwordUser ? [passwordUser] : []),
          ...matchingUsers.filter((user) => user._id !== args.existingUserId),
        ]
          .filter(
            (user, index, allUsers) =>
              allUsers.findIndex((candidate) => candidate._id === user._id) ===
              index
          )
          .filter(
            (user) =>
              user._id === args.existingUserId ||
              (typeof user.email === 'string' &&
                normalizeEmail(user.email) === email)
          );
        const candidates: {
          user: Doc<'users'>;
          profile: Doc<'profiles'> | null;
        }[] = [];
        for (const user of users) {
          const profile = await db
            .query('profiles')
            .withIndex('by_user', (q) => q.eq('userId', user._id))
            .unique();
          candidates.push({ user, profile });
        }

        const decision = selectAuthLinkingDecision(
          candidates.map(({ user, profile }) => ({
            userId: user._id,
            hasProfile: profile !== null,
          })),
          args.existingUserId,
          matchingPasswordAccounts[0]?.userId,
          account
            ? {
                userId: account.userId,
                emailVerified: account.emailVerified,
              }
            : undefined
        );
        const userId = decision.userId;
        if (userId !== args.existingUserId) {
          await ensureAccountActive(ctx, userId);
        }

        await db.patch(userId, {
          email,
          emailVerificationTime: Date.now(),
        });
        if (decision.cleanupCandidateId) {
          await ctx.scheduler.runAfter(
            0,
            internal.auth.cleanupDetachedPlaceholderUser,
            { userId: decision.cleanupCandidateId }
          );
        }
        return userId;
      }

      if (args.type !== 'email' || !email) {
        throw new Error(ACCOUNT_MATCH_ERROR);
      }

      const matchingUsers = await db
        .query('users')
        .withIndex('email', (q) => q.eq('email', email))
        .take(3);
      if (matchingUsers.length > 1) throw new Error(ACCOUNT_MATCH_ERROR);

      return await db.insert('users', {});
    },
    async beforeSessionCreation(ctx, { userId }) {
      await ensureAccountActive(ctx, userId);
    },
  },
});

export const cleanupDetachedPlaceholderUser = internalMutation({
  args: { userId: v.id('users') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    const account = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', args.userId))
      .first();
    const session = await ctx.db
      .query('authSessions')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .first();
    if (profile || account || session) return null;

    const user = await ctx.db.get(args.userId);
    if (user) await ctx.db.delete(user._id);
    return null;
  },
});

export const cleanupFailedOtpSend = internalMutation({
  args: {
    email: v.string(),
    verificationCodeHash: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let email: string;
    try {
      email = normalizeEmail(args.email);
    } catch {
      return null;
    }

    const account = await ctx.db
      .query('authAccounts')
      .withIndex('providerAndAccountId', (q) =>
        q.eq('provider', 'email').eq('providerAccountId', email)
      )
      .unique();
    if (!account) return null;

    const [profile, accounts, session, user, verificationCodes] =
      await Promise.all([
        ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', account.userId))
          .first(),
        ctx.db
          .query('authAccounts')
          .withIndex('userIdAndProvider', (q) =>
            q.eq('userId', account.userId)
          )
          .take(2),
        ctx.db
          .query('authSessions')
          .withIndex('userId', (q) => q.eq('userId', account.userId))
          .first(),
        ctx.db.get(account.userId),
        ctx.db
          .query('authVerificationCodes')
          .withIndex('accountId', (q) => q.eq('accountId', account._id))
          .take(2),
      ]);
    const verificationCode =
      verificationCodes.length === 1 ? verificationCodes[0] : undefined;
    const verificationCodeMatches =
      args.verificationCodeHash !== undefined &&
      verificationCode?.provider === 'email' &&
      verificationCode.code === args.verificationCodeHash &&
      verificationCode.emailVerified === email;

    if (
      !isFailedOtpCleanupEligible({
        accountProvider: account.provider,
        providerAccountId: account.providerAccountId,
        normalizedEmail: email,
        accountEmailVerified: account.emailVerified,
        userEmailVerificationTime: user?.emailVerificationTime,
        hasProfile: profile !== null,
        authAccountCount: accounts.length,
        hasActiveSession: session !== null,
        verificationCodeMatches,
      })
    ) {
      return null;
    }

    if (!verificationCode) return null;
    await ctx.db.delete(verificationCode._id);
    await ctx.db.delete(account._id);
    if (user) await ctx.db.delete(user._id);
    return null;
  },
});

export const loggedInUser = query({
  args: {},
  returns: v.union(v.null(), authUserValidator),
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
