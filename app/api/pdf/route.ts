import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { toProfileContent } from '@/lib/profile-utils';
import { ResumeDocument } from '@/lib/pdf/resume-document';
import React from 'react';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('username');
  const themed = searchParams.get('theme') === 'true';

  if (!username) {
    return NextResponse.json(
      { error: 'username is required' },
      { status: 400 }
    );
  }

  try {
    const profile = await fetchQuery(api.profiles.getProfileByUsername, {
      username,
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found or is private' },
        { status: 404 }
      );
    }

    const profileContent = toProfileContent(profile);
    const colorTheme = profile.colorTheme ?? undefined;

    const element = React.createElement(ResumeDocument, {
      profile: profileContent,
      themed,
      colorTheme,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    const safeName = profile.name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    const filename = `${safeName}_CV.pdf`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
