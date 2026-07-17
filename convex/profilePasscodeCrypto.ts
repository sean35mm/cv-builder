'use node';

import { hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';
import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { isProfilePasscodeHash } from '../lib/profile/passcode-policy';

const DIGEST_PATTERN = /^[a-f0-9]{64}$/;

export const hashDigest = internalAction({
  args: { digest: v.string() },
  returns: v.string(),
  handler: async (_ctx, args) => {
    if (!DIGEST_PATTERN.test(args.digest)) throw new Error('Invalid request');
    return await hash(args.digest, {
      algorithm: 2,
      version: 1,
      memoryCost: 64 * 1024,
      timeCost: 3,
      parallelism: 1,
      outputLen: 32,
      salt: randomBytes(16),
    });
  },
});

export const verifyDigest = internalAction({
  args: { digest: v.string(), encodedHash: v.string() },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    if (
      !DIGEST_PATTERN.test(args.digest) ||
      !isProfilePasscodeHash(args.encodedHash)
    ) {
      return false;
    }
    try {
      return await verify(args.encodedHash, args.digest);
    } catch {
      return false;
    }
  },
});
