import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { toProfileContent } from '@/lib/profile-utils';
import { ResumeDocument } from '@/lib/pdf/resume-document';
import React from 'react';
import { createHash } from 'node:crypto';
import { trustedCallerAddress } from '@/lib/pdf/trusted-ip-header';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import {
  grantTokenForUsername,
  PROFILE_GRANT_COOKIE,
  profileAccessService,
  type AuthorizedProfileBundle,
  type ProfileAccessEnvelope,
} from '@/lib/profile/passcode-server';
import {
  PRIVATE_NO_STORE_HEADERS,
  privateNoStoreNotFoundResponse,
} from '@/lib/profile/request-security';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';

function callerHash(request: NextRequest): string {
  const address =
    trustedCallerAddress(request.headers, {
      vercel: process.env.VERCEL,
      cfPages: process.env.CF_PAGES,
      flyAppName: process.env.FLY_APP_NAME,
      trustedIpHeader: process.env.PDF_TRUSTED_IP_HEADER,
    }) ?? 'unavailable';
  return createHash('sha256').update(`pdf-caller:${address}`).digest('hex');
}

type ProtectedPdfAuthorization = {
  profileId: string;
  username: string;
  authorization: 'grant' | 'owner';
};

type PublicPdfAuthorization = {
  profileId: string;
  username: string;
  receipt: string;
};

const pdfRateLimited = (retryAfterSeconds: number): NextResponse =>
  NextResponse.json(
    { error: 'Too many PDF requests. Please try again later.' },
    {
      status: 429,
      headers: {
        ...PRIVATE_NO_STORE_HEADERS,
        'Retry-After': String(Math.max(1, retryAfterSeconds)),
      },
    }
  );

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('username');
  const locale = searchParams.get('locale') ?? undefined;
  const themed = searchParams.get('theme') === 'true';
  const hostBinding = await resolveRequestHostBinding(request);

  if (hostBinding.kind === 'denied') return privateNoStoreNotFoundResponse();
  if (
    !username ||
    username.length > 100 ||
    /[/?#%\\]/.test(username) ||
    (hostBinding.kind === 'custom' && username !== hostBinding.username)
  ) {
    if (hostBinding.kind === 'custom') return privateNoStoreNotFoundResponse();
    return NextResponse.json(
      { error: 'A valid username is required' },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  try {
    const requestCallerHash = callerHash(request);
    const authorizationResponse =
      await profileAccessService<PublicPdfAuthorization>(
        'pdf-authorize-public',
        {
          username,
          callerHash: requestCallerHash,
        }
      );
    if (authorizationResponse.status === 429) {
      return pdfRateLimited(authorizationResponse.retryAfterSeconds ?? 60);
    }
    if (!authorizationResponse.ok) throw new Error('PDF authorization failed');
    const authorization = authorizationResponse.data;
    let profile = authorization
      ? await fetchQuery(api.profileLocales.getByUsername, {
          username: authorization.username,
          locale,
        })
      : null;
    type PdfProfile = NonNullable<typeof profile>;
    let protectedProfile = false;
    let protectedToken: string | undefined;
    let protectedTestimonials: Array<{
      _id: string;
      authorName: string;
      authorTitle?: string;
      authorCompany?: string;
      relationship: string;
      content: string;
      rating?: number;
      createdAt: number;
    }> | null = null;
    if (!profile) {
      const envelopeResponse =
        await profileAccessService<ProfileAccessEnvelope>('envelope', {
          username,
        });
      const envelope = envelopeResponse.ok ? envelopeResponse.data : null;
      if (envelope?.mode !== 'passcode') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404, headers: PRIVATE_NO_STORE_HEADERS }
        );
      }
      protectedToken = grantTokenForUsername(
        request.cookies.get(PROFILE_GRANT_COOKIE)?.value,
        envelope.username
      );
      const authToken =
        hostBinding.kind === 'custom'
          ? undefined
          : await convexAuthNextjsToken();
      const ownerProfile = authToken
        ? await fetchQuery(
            api.profiles.getMyProfile,
            {},
            { token: authToken }
          ).catch(() => null)
        : null;
      const ownerProfileId =
        ownerProfile?._id === envelope.profileId ? ownerProfile._id : undefined;
      const protectedAuthorization =
        await profileAccessService<ProtectedPdfAuthorization>('pdf-authorize', {
          username: envelope.username,
          ...(protectedToken ? { token: protectedToken } : {}),
          ...(ownerProfileId ? { ownerProfileId } : {}),
        });
      if (protectedAuthorization.status === 429) {
        return pdfRateLimited(protectedAuthorization.retryAfterSeconds ?? 60);
      }
      if (
        !protectedAuthorization.ok ||
        !protectedAuthorization.data ||
        protectedAuthorization.data.profileId !== envelope.profileId
      ) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404, headers: PRIVATE_NO_STORE_HEADERS }
        );
      }
      const bundleResponse = await profileAccessService<
        AuthorizedProfileBundle<
          PdfProfile,
          NonNullable<typeof protectedTestimonials>[number]
        >
      >('bundle', {
        username: envelope.username,
        ...(protectedToken ? { token: protectedToken } : {}),
        ...(ownerProfileId ? { ownerProfileId } : {}),
        ...(locale ? { locale } : {}),
      });
      if (!bundleResponse.ok || !bundleResponse.data) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404, headers: PRIVATE_NO_STORE_HEADERS }
        );
      }
      profile = bundleResponse.data.profile;
      if (profile._id !== protectedAuthorization.data.profileId) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404, headers: PRIVATE_NO_STORE_HEADERS }
        );
      }
      protectedTestimonials = bundleResponse.data.testimonials;
      protectedProfile = true;
    }

    if (authorization && profile._id !== authorization.profileId) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404, headers: PRIVATE_NO_STORE_HEADERS }
      );
    }

    const profileContent = toProfileContent(profile);
    const colorTheme = profile.colorTheme ?? undefined;
    const testimonials =
      protectedTestimonials ??
      (await fetchQuery(api.testimonials.getPublicTestimonials, {
        profileId: profile._id,
      }).catch(() => []));

    const element = React.createElement(ResumeDocument, {
      profile: profileContent,
      themed,
      colorTheme,
      headingFont: profile.headingFont,
      bodyFont: profile.bodyFont,
      sectionsVisibility: profile.sectionsVisibility,
      testimonials,
    }) as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);
    if (protectedProfile && protectedToken) {
      await profileAccessService('event', {
        username: profile.username,
        token: protectedToken,
        eventType: 'pdf_download',
      }).catch(() => null);
    } else if (authorization) {
      await profileAccessService('pdf-complete', {
        receipt: authorization.receipt,
        callerHash: requestCallerHash,
      }).catch(() => null);
    }

    const safeName = profile.name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    const filename = `${safeName}_CV.pdf`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        Pragma: 'no-cache',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
}
