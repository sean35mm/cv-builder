import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { isRateLimitError } from '@convex-dev/rate-limiter';
import { api } from '@/convex/_generated/api';
import { toProfileContent } from '@/lib/profile-utils';
import { ResumeDocument } from '@/lib/pdf/resume-document';
import React from 'react';
import { createHash } from 'node:crypto';
import { trustedCallerAddress } from '@/lib/pdf/trusted-ip-header';

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('username');
  const themed = searchParams.get('theme') === 'true';

  if (!username || username.length > 100 || /[/?#%\\]/.test(username)) {
    return NextResponse.json(
      { error: 'A valid username is required' },
      { status: 400 }
    );
  }

  try {
    const requestCallerHash = callerHash(request);
    const authorization = await fetchMutation(api.pdf.authorizePdf, {
      username,
      callerHash: requestCallerHash,
    });

    if (!authorization) {
      return NextResponse.json(
        { error: 'Profile not found or is private' },
        { status: 404 }
      );
    }

    const profile = await fetchQuery(api.profiles.getProfileByUsername, {
      username: authorization.username,
    });

    if (!profile || profile._id !== authorization.profileId) {
      return NextResponse.json(
        { error: 'Profile not found or is private' },
        { status: 404 }
      );
    }

    const profileContent = toProfileContent(profile);
    const colorTheme = profile.colorTheme ?? undefined;
    const testimonials = await fetchQuery(
      api.testimonials.getPublicTestimonials,
      { profileId: profile._id }
    ).catch(() => []);

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
    await fetchMutation(api.pdf.completeDownload, {
      receipt: authorization.receipt,
      callerHash: requestCallerHash,
    });

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
      },
    });
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: 'Too many PDF requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'private, no-store, max-age=0',
            'Retry-After': String(
              Math.max(1, Math.ceil(error.data.retryAfter / 1000))
            ),
          },
        }
      );
    }
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
