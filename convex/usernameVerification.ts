import type { MutationCtx, QueryCtx } from './_generated/server';

export const USERNAME_VERIFICATION_KEY = 'normalized-usernames-v1' as const;

export const getUsernameVerification = (ctx: Pick<QueryCtx, 'db'>) =>
  ctx.db
    .query('usernameVerification')
    .withIndex('by_key', (q) => q.eq('key', USERNAME_VERIFICATION_KEY))
    .unique();

// Every identity writer must participate in this protocol. Canonical, unique
// writes preserve a completed certificate, but interrupt a multi-page scan.
// Removing profiles and changing non-identity fields preserve both invariants.
export async function invalidateUsernameVerification(
  ctx: Pick<MutationCtx, 'db'>,
  preservesVerified = false
): Promise<void> {
  const state = await getUsernameVerification(ctx);
  if (
    !state ||
    state.status === 'unverified' ||
    state.status === 'blocked' ||
    (preservesVerified && state.status === 'verified')
  ) {
    return;
  }
  await ctx.db.patch(state._id, {
    status: 'unverified',
    cursor: null,
    checked: 0,
    issues: 0,
  });
}
