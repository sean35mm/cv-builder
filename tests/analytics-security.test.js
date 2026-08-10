import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('analytics event security', () => {
  test('routes unprotected events through the authenticated service boundary', () => {
    const route = source('app/api/analytics/event/route.ts');
    const accessRoute = source('app/api/profile-access/event/route.ts');
    const accessHttp = source('convex/profileAccessHttp.ts');
    const http = source('convex/http.ts');

    expect(route).toContain("profileAccessService('analytics-event'");
    expect(route).not.toContain('fetchMutation');
    expect(route).not.toContain('api.analytics.recordView');
    expect(route).toContain('trustedCallerAddress(request.headers');
    expect(route).toContain('update(`analytics-caller:${address}`)');
    expect(route).not.toContain("headers.get('x-forwarded-for')");
    expect(accessRoute).not.toContain('api.analytics.recordView');
    expect(accessRoute).toContain("profileAccessService('event'");
    expect(accessHttp).toContain(
      'export const analyticsEvent = authenticatedAction'
    );
    expect(accessHttp).toContain(
      'ctx.runMutation(internal.analytics.recordView'
    );
    expect(accessHttp).toContain('if (!(await serviceAuthorized(request)))');
    expect(accessHttp).toContain("return json({ error: 'Not found' }, 404)");
    expect(http).toContain("path: '/profile-access/analytics-event'");
    expect(http).toContain('handler: analyticsEvent');
  });

  test('strictly validates the dedicated service payload', () => {
    const accessHttp = source('convex/profileAccessHttp.ts');
    const action = accessHttp.slice(
      accessHttp.indexOf('export const analyticsEvent'),
      accessHttp.indexOf('export const authorizeProtectedPdf')
    );

    expect(action).toContain("['profileId', 'username']");
    for (const field of [
      'callerHash',
      'referrer',
      'countryCode',
      'deviceCategory',
      'utmSource',
      'utmMedium',
      'utmCampaign',
    ]) {
      expect(action).toContain(`'${field}'`);
    }
    expect(action).toContain('/^[a-f0-9]{64}$/');
    expect(action).toContain('!isOptionalReferrerHostname(body.referrer)');
    expect(action).toContain('isOptionalNormalizedUtm');
  });

  test('derives protected event metadata without forwarding raw caller fields', () => {
    const route = source('app/api/profile-access/event/route.ts');
    const accessHttp = source('convex/profileAccessHttp.ts');
    const profileAccess = source('convex/profileAccess.ts');
    const eventAction = accessHttp.slice(
      accessHttp.indexOf('export const event'),
      accessHttp.indexOf('export const analyticsEvent')
    );
    const eventMutation = profileAccess.slice(
      profileAccess.indexOf('export const recordProtectedEvent')
    );

    expect(route).toContain("values.eventType !== 'view'");
    expect(route).toContain('safeReferrerHostname(values.referrer)');
    expect(route).toContain(
      'trustedVercelCountry(request.headers, process.env.VERCEL)'
    );
    expect(route).toContain(
      "coarseDeviceCategory(request.headers.get('user-agent'))"
    );
    expect(route).toContain('normalizeUtmValue(values.utmCampaign)');
    expect(route).not.toContain('{ ...values, token }');
    expect(eventAction).toContain('!isOptionalReferrerHostname(body.referrer)');
    expect(eventAction).toContain('isOptionalNormalizedUtm');
    expect(eventMutation).toContain(
      "throw new Error('Invalid analytics metadata')"
    );
    expect(eventMutation).toContain(
      'safeReferrerHostname(`https://${args.referrer}`)'
    );
  });

  test('keeps recordView internal and atomically validates canonical binding', () => {
    const analytics = source('convex/analytics.ts');

    expect(analytics).toContain('export const recordView = internalMutation');
    expect(analytics).not.toContain('export const recordView = mutation');
    expect(analytics).toContain('username: v.string()');
    expect(analytics).toContain('profile.username !== args.username');
  });

  test('keeps a profile ceiling and adds a hashed caller-profile limit', () => {
    const analytics = source('convex/analytics.ts');
    const limits = source('convex/rateLimits.ts');
    const callerLimitIndex = analytics.indexOf(
      "rateLimiter.limit(ctx, 'analyticsEventPerCallerProfile'"
    );
    const profileLimitIndex = analytics.indexOf(
      "rateLimiter.limit(ctx, 'analyticsEvent'"
    );

    expect(callerLimitIndex).toBeGreaterThan(-1);
    expect(profileLimitIndex).toBeGreaterThan(callerLimitIndex);
    expect(analytics).toContain(
      "stableRateLimitKey(\n          'analytics-caller-profile'"
    );
    expect(limits).toContain('analyticsEventPerCallerProfile:');
  });
});

describe('PDF analytics privacy', () => {
  test('keeps PDF mutations internal behind strict authenticated HTTP routes', () => {
    const pdf = source('convex/pdf.ts');
    const accessHttp = source('convex/profileAccessHttp.ts');
    const http = source('convex/http.ts');
    const route = source('app/api/pdf/route.ts');

    expect(pdf).toContain('export const authorizePdf = internalMutation');
    expect(pdf).toContain('export const completeDownload = internalMutation');
    expect(pdf).not.toContain('export const authorizePdf = mutation');
    expect(pdf).not.toContain('export const completeDownload = mutation');
    expect(accessHttp).toContain(
      'export const authorizePublicPdf = authenticatedAction'
    );
    expect(accessHttp).toContain('ctx.runMutation(internal.pdf.authorizePdf');
    expect(accessHttp).toContain(
      'export const completePublicPdf = authenticatedAction'
    );
    expect(accessHttp).toContain(
      'ctx.runMutation(internal.pdf.completeDownload'
    );
    expect(http).toContain("path: '/profile-access/pdf-authorize-public'");
    expect(http).toContain("path: '/profile-access/pdf-complete'");
    expect(route).toContain("'pdf-authorize-public'");
    expect(route).toContain("profileAccessService('pdf-complete'");
    expect(route).not.toContain('fetchMutation');
    expect(route).not.toContain('api.pdf.');
  });

  test('consumes a valid receipt before respecting disabled analytics', () => {
    const pdf = source('convex/pdf.ts');
    const completion = pdf.slice(pdf.indexOf('export const completeDownload'));
    const callerMatchIndex = completion.indexOf(
      'if (receipt.callerHash !== args.callerHash) return null;'
    );
    const deleteIndex = completion.indexOf(
      'await ctx.db.delete(receipt._id)',
      callerMatchIndex
    );
    const disabledIndex = completion.indexOf(
      'profile.analyticsEnabled === false',
      deleteIndex
    );
    const insertIndex = completion.indexOf(
      "await ctx.db.insert('profileAnalytics'",
      disabledIndex
    );

    expect(callerMatchIndex).toBeGreaterThan(-1);
    expect(deleteIndex).toBeGreaterThan(callerMatchIndex);
    expect(disabledIndex).toBeGreaterThan(deleteIndex);
    expect(insertIndex).toBeGreaterThan(disabledIndex);
  });

  test('treats post-render analytics completion as best effort', () => {
    const route = source('app/api/pdf/route.ts');
    const renderIndex = route.indexOf('await renderToBuffer(element)');
    const protectedCompletionIndex = route.indexOf(
      "profileAccessService('event'",
      renderIndex
    );
    const publicCompletionIndex = route.indexOf(
      "profileAccessService('pdf-complete'",
      renderIndex
    );
    const responseIndex = route.indexOf(
      'return new NextResponse(buffer',
      renderIndex
    );

    expect(protectedCompletionIndex).toBeGreaterThan(renderIndex);
    expect(publicCompletionIndex).toBeGreaterThan(protectedCompletionIndex);
    expect(route.slice(protectedCompletionIndex, responseIndex)).toContain(
      '.catch(() => null)'
    );
    expect(responseIndex).toBeGreaterThan(publicCompletionIndex);
  });
});
