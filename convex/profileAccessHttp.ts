import { httpAction } from './_generated/server';
import type { ActionCtx } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { isRateLimitError } from '@convex-dev/rate-limiter';
import { DUMMY_PROFILE_PASSCODE_HASH } from '../lib/profile/argon-contract';
import { isProfileAccessMode } from '../lib/profile/access';
import {
  rateLimitResponse,
  retryAfterSeconds,
} from '../lib/profile/configure-limit-policy';
import { readBoundedJson } from '../lib/profile/request-security';
import {
  validateRasterUploadReservation,
} from '../lib/profile/raster-image-policy';

const SERVICE_HEADER = 'x-profile-access-service-secret';
const MAX_BODY_BYTES = 20_000;
const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Content-Type': 'application/json',
  Pragma: 'no-cache',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
};
const ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PREVIEW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{48}$/;

const hasFields = (
  body: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = []
): boolean => {
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((field) =>
      Object.prototype.hasOwnProperty.call(body, field)
    ) &&
    Object.keys(body).every((field) => allowed.has(field))
  );
};

const isId = (value: unknown): value is string =>
  typeof value === 'string' && ID_PATTERN.test(value);
const isUsername = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length >= 1 &&
  value.length <= 100 &&
  !/[/?#%\\]/.test(value) &&
  !Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
const isToken = (value: unknown): value is string =>
  typeof value === 'string' && TOKEN_PATTERN.test(value);
const isOptionalId = (value: unknown): value is string | undefined =>
  value === undefined || isId(value);
const isOptionalToken = (value: unknown): value is string | undefined =>
  value === undefined || isToken(value);
const isOptionalLocale = (value: unknown): value is string | undefined =>
  value === undefined ||
  (typeof value === 'string' && value.length >= 2 && value.length <= 35);

const json = (
  body: unknown,
  status = 200,
  headers?: Record<string, string>
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  });

const sha256 = async (value: string): Promise<Uint8Array> =>
  new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  );

const serviceAuthorized = async (request: Request): Promise<boolean> => {
  const expected = process.env.PROFILE_ACCESS_SERVICE_SECRET;
  const supplied = request.headers.get(SERVICE_HEADER);
  if (!expected || expected.length < 32 || !supplied) return false;
  const [expectedHash, suppliedHash] = await Promise.all([
    sha256(expected),
    sha256(supplied),
  ]);
  let difference = 0;
  for (let index = 0; index < expectedHash.length; index += 1) {
    difference |= expectedHash[index] ^ suppliedHash[index];
  }
  return difference === 0;
};

const requestBody = async (request: Request): Promise<Record<string, unknown>> => {
  const contentType = request.headers.get('content-type')?.split(';')[0];
  if (contentType !== 'application/json') throw new Error('Invalid request');
  const body: unknown = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Invalid request');
  }
  return body as Record<string, unknown>;
};

const tokenHash = async (token: unknown): Promise<string | undefined> => {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return undefined;
  }
  const digest = await sha256(token);
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const authenticatedAction = (
  handler: (ctx: ActionCtx, body: Record<string, unknown>) => Promise<Response>
) =>
  httpAction(async (ctx, request) => {
    if (!(await serviceAuthorized(request))) return json({ error: 'Not found' }, 404);
    try {
      return await handler(ctx as ActionCtx, await requestBody(request));
    } catch {
      return json({ error: 'Request failed' }, 400);
    }
  });

export const envelope = authenticatedAction(async (ctx, body) => {
  if (!hasFields(body, ['username']) || !isUsername(body.username)) {
    return json({ error: 'Request failed' }, 400);
  }
  const result = await ctx.runQuery(internal.profileAccess.getEnvelope, {
    username: body.username,
  });
  return json(result);
});

export const bundle = authenticatedAction(async (ctx, body) => {
  if (
    !hasFields(body, ['username'], ['token', 'ownerProfileId', 'locale']) ||
    !isUsername(body.username) ||
    !isOptionalToken(body.token) ||
    !isOptionalId(body.ownerProfileId) ||
    !isOptionalLocale(body.locale)
  ) {
    return json({ error: 'Request failed' }, 400);
  }
  const result = await ctx.runQuery(internal.profileAccess.getBundle, {
    username: body.username,
    tokenHash: await tokenHash(body.token),
    ownerProfileId: body.ownerProfileId as Id<'profiles'> | undefined,
    locale: body.locale,
  });
  return result ? json(result) : json({ error: 'Not authorized' }, 401);
});

export const configure = authenticatedAction(async (ctx, body) => {
  if (
    !hasFields(body, ['profileId', 'mode'], ['digest']) ||
    !isId(body.profileId) ||
    !isProfileAccessMode(body.mode) ||
    (body.mode === 'passcode' &&
      (typeof body.digest !== 'string' || !/^[a-f0-9]{64}$/.test(body.digest))) ||
    (body.mode !== 'passcode' && body.digest !== undefined)
  ) {
    return json({ error: 'Request failed' }, 400);
  }
  try {
    await ctx.runMutation(internal.profileAccess.prepareConfigure, {
      profileId: body.profileId as Id<'profiles'>,
    });
  } catch (error) {
    if (isRateLimitError(error)) {
      return json({ error: 'Request failed' }, 429, {
        'Retry-After': String(retryAfterSeconds(error.data.retryAfter)),
      });
    }
    return json({ error: 'Request failed' }, 400);
  }
  const encodedHash =
    body.mode === 'passcode'
      ? await ctx.runAction(internal.profilePasscodeCrypto.hashDigest, {
          digest: body.digest as string,
        })
      : undefined;
  const result = await ctx.runMutation(internal.profileAccess.configure, {
    profileId: body.profileId as Id<'profiles'>,
    mode: body.mode,
    encodedHash,
  });
  return json(result);
});

export const unlock = authenticatedAction(async (ctx, body) => {
  if (
    !hasFields(body, ['username', 'callerHash', 'digest']) ||
    !isUsername(body.username) ||
    typeof body.callerHash !== 'string' ||
    typeof body.digest !== 'string' ||
    !/^[a-f0-9]{64}$/.test(body.callerHash) ||
    !/^[a-f0-9]{64}$/.test(body.digest)
  ) {
    return json({ error: 'Unable to unlock profile' }, 401);
  }
  let attempt;
  try {
    attempt = await ctx.runMutation(internal.profileAccess.beginUnlock, {
      username: body.username,
      callerHash: body.callerHash,
    });
  } catch (error) {
    return isRateLimitError(error)
      ? json({ error: 'Unable to unlock profile' }, 429, {
          'Retry-After': String(retryAfterSeconds(error.data.retryAfter)),
        })
      : json({ error: 'Unable to unlock profile' }, 400);
  }
  const verified = await ctx.runAction(
    internal.profilePasscodeCrypto.verifyDigest,
    {
      digest: body.digest,
      encodedHash: attempt.encodedHash ?? DUMMY_PROFILE_PASSCODE_HASH,
    }
  );
  if (!verified || !attempt.eligible || !attempt.profileId) {
    return json({ error: 'Unable to unlock profile' }, 401);
  }
  const grant = await ctx.runMutation(internal.profileAccess.issueGrant, {
    profileId: attempt.profileId,
    accessVersion: attempt.accessVersion,
  });
  return grant
    ? json(grant)
    : json({ error: 'Unable to unlock profile' }, 401);
});

export const revoke = authenticatedAction(async (ctx, body) => {
  if (!hasFields(body, ['profileId']) || !isId(body.profileId)) {
    return json({ error: 'Request failed' }, 400);
  }
  await ctx.runMutation(internal.profileAccess.revokeGrants, {
    profileId: body.profileId as Id<'profiles'>,
  });
  return json({ ok: true });
});

export const storage = authenticatedAction(async (ctx, body) => {
  if (
    !hasFields(body, ['username', 'storageId'], ['token', 'ownerProfileId']) ||
    !isUsername(body.username) ||
    !isId(body.storageId) ||
    !isOptionalToken(body.token) ||
    !isOptionalId(body.ownerProfileId)
  ) {
    return json({ error: 'Not authorized' }, 401);
  }
  const result = await ctx.runQuery(internal.profileAccess.getProtectedStorageAccess, {
    username: body.username,
    storageId: body.storageId as Id<'_storage'>,
    tokenHash: await tokenHash(body.token),
    ownerProfileId: body.ownerProfileId as Id<'profiles'> | undefined,
  });
  return result ? json(result) : json({ error: 'Not authorized' }, 401);
});

export const storageResolve = authenticatedAction(async (ctx, body) => {
  const protectedRequest = body.authorization === 'protected';
  const standardRequest = body.authorization === 'standard';
  if (
    (!protectedRequest && !standardRequest) ||
    !hasFields(
      body,
      protectedRequest
        ? ['authorization', 'username', 'storageId']
        : ['authorization', 'storageId'],
      protectedRequest
        ? ['token', 'ownerProfileId']
        : ['previewToken', 'profileUsername', 'ownerProfileId']
    ) ||
    !isId(body.storageId) ||
    !isOptionalId(body.ownerProfileId) ||
    (protectedRequest &&
      (!isUsername(body.username) || !isOptionalToken(body.token))) ||
    (standardRequest &&
      ((body.previewToken !== undefined &&
        (typeof body.previewToken !== 'string' ||
          !PREVIEW_TOKEN_PATTERN.test(body.previewToken))) ||
        (body.profileUsername !== undefined && !isUsername(body.profileUsername))))
  ) {
    return json({ error: 'Not authorized' }, 401);
  }
  const ownerProfileId =
    typeof body.ownerProfileId === 'string'
      ? (body.ownerProfileId as Id<'profiles'>)
      : undefined;
  const result =
    body.authorization === 'protected'
      ? typeof body.username === 'string'
        ? await ctx.runQuery(internal.profileAccess.resolveProtectedStorageUrl, {
            username: body.username,
            storageId: body.storageId as Id<'_storage'>,
            tokenHash: await tokenHash(body.token),
            ownerProfileId,
          })
        : null
      : await ctx.runQuery(internal.storage.resolveImageStorageUrl, {
          storageId: body.storageId as Id<'_storage'>,
          previewToken:
            typeof body.previewToken === 'string'
              ? body.previewToken
              : undefined,
          profileUsername:
            typeof body.profileUsername === 'string'
              ? body.profileUsername
              : undefined,
          ownerProfileId,
        });
  return result ? json(result) : json({ error: 'Not authorized' }, 401);
});

export const uploadReserve = authenticatedAction(async (ctx, body) => {
  const reservationInput = validateRasterUploadReservation(
    body.expectedContentType,
    body.expectedSize
  );
  if (
    !hasFields(body, ['profileId', 'expectedContentType', 'expectedSize']) ||
    !isId(body.profileId) ||
    !reservationInput
  ) {
    return json({ error: 'Request failed' }, 400);
  }
  try {
    const reservation = await ctx.runMutation(internal.storage.reserveImageUpload, {
      profileId: body.profileId as Id<'profiles'>,
      expectedContentType: reservationInput.expectedContentType,
      expectedSize: reservationInput.expectedSize,
    });
    return json(reservation);
  } catch (error) {
    if (isRateLimitError(error)) {
      const response = rateLimitResponse(error.data.retryAfter);
      return json({ error: 'Request failed' }, response.status, response.headers);
    }
    throw error;
  }
});

export const uploadComplete = authenticatedAction(async (ctx, body) => {
  if (
    !hasFields(body, ['uploadToken', 'storageId']) ||
    typeof body.uploadToken !== 'string' ||
    !PREVIEW_TOKEN_PATTERN.test(body.uploadToken) ||
    !isId(body.storageId)
  ) {
    return json({ error: 'Request failed' }, 400);
  }
  const result = await ctx.runMutation(internal.storage.completeImageUpload, {
    uploadToken: body.uploadToken,
    storageId: body.storageId as Id<'_storage'>,
  });
  return result.status === 'success'
    ? json(result)
    : json({ error: 'Request failed' }, 400);
});

export const uploadAbort = authenticatedAction(async (ctx, body) => {
  if (
    !hasFields(body, ['uploadToken'], ['storageId']) ||
    typeof body.uploadToken !== 'string' ||
    !PREVIEW_TOKEN_PATTERN.test(body.uploadToken) ||
    (body.storageId !== undefined && !isId(body.storageId))
  ) {
    return json({ error: 'Request failed' }, 400);
  }
  await ctx.runMutation(internal.storage.abortImageUpload, {
    uploadToken: body.uploadToken,
    storageId:
      typeof body.storageId === 'string'
        ? (body.storageId as Id<'_storage'>)
        : undefined,
  });
  return json({ ok: true });
});

export const contact = authenticatedAction(async (ctx, body) => {
  const hash = await tokenHash(body.token);
  if (
    !hasFields(body, [
      'username',
      'token',
      'senderName',
      'senderEmail',
      'subject',
      'message',
    ]) ||
    !hash ||
    !isUsername(body.username) ||
    typeof body.senderName !== 'string' ||
    body.senderName.length > 120 ||
    typeof body.senderEmail !== 'string' ||
    body.senderEmail.length > 320 ||
    typeof body.subject !== 'string' ||
    body.subject.length > 200 ||
    typeof body.message !== 'string' ||
    body.message.length > 5000
  ) {
    return json({ error: 'Unable to send message' }, 400);
  }
  const sent = await ctx.runMutation(internal.profileAccess.sendProtectedMessage, {
    username: body.username,
    tokenHash: hash,
    senderName: body.senderName,
    senderEmail: body.senderEmail,
    subject: body.subject,
    message: body.message,
  });
  return sent ? json({ ok: true }) : json({ error: 'Unable to send message' }, 401);
});

export const event = authenticatedAction(async (ctx, body) => {
  const hash = await tokenHash(body.token);
  if (
    !hasFields(body, ['username', 'token', 'eventType'], [
      'referrer',
      'countryCode',
      'deviceCategory',
      'utmSource',
      'utmMedium',
      'utmCampaign',
    ]) ||
    !hash ||
    !isUsername(body.username) ||
    (body.eventType !== 'view' && body.eventType !== 'pdf_download') ||
    (body.referrer !== undefined &&
      (typeof body.referrer !== 'string' || body.referrer.length > 253)) ||
    (body.countryCode !== undefined &&
      (typeof body.countryCode !== 'string' ||
        !/^[A-Z]{2}$/.test(body.countryCode))) ||
    (body.deviceCategory !== undefined &&
      !['desktop', 'mobile', 'tablet', 'other'].includes(
        body.deviceCategory as string
      )) ||
    [body.utmSource, body.utmMedium, body.utmCampaign].some(
      (value) => value !== undefined && typeof value !== 'string'
    )
  ) {
    return json({ error: 'Unable to record event' }, 400);
  }
  const recorded = await ctx.runMutation(internal.profileAccess.recordProtectedEvent, {
    username: body.username,
    tokenHash: hash,
    eventType: body.eventType,
    referrer: body.referrer,
    countryCode: body.countryCode,
    deviceCategory: body.deviceCategory as
      | 'desktop'
      | 'mobile'
      | 'tablet'
      | 'other'
      | undefined,
    utmSource: body.utmSource as string | undefined,
    utmMedium: body.utmMedium as string | undefined,
    utmCampaign: body.utmCampaign as string | undefined,
  });
  return recorded ? json({ ok: true }) : json({ error: 'Unable to record event' }, 401);
});

export const authorizeProtectedPdf = authenticatedAction(async (ctx, body) => {
  if (
    !hasFields(body, ['username'], ['token', 'ownerProfileId']) ||
    !isUsername(body.username) ||
    !isOptionalToken(body.token) ||
    !isOptionalId(body.ownerProfileId) ||
    (body.token === undefined && body.ownerProfileId === undefined)
  ) {
    return json({ error: 'Not authorized' }, 401);
  }
  try {
    const result = await ctx.runMutation(
      internal.profileAccess.authorizeProtectedPdf,
      {
        username: body.username,
        tokenHash: await tokenHash(body.token),
        ownerProfileId: body.ownerProfileId as Id<'profiles'> | undefined,
      }
    );
    return result ? json(result) : json({ error: 'Not authorized' }, 401);
  } catch (error) {
    if (isRateLimitError(error)) {
      return json({ error: 'Request failed' }, 429, {
        'Retry-After': String(retryAfterSeconds(error.data.retryAfter)),
      });
    }
    throw error;
  }
});
