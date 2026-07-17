import { fetchQuery } from 'convex/nextjs';
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { api } from '@/convex/_generated/api';
import { resolveRequestHostBinding } from '@/lib/custom-domains/server-resolver';
import {
  profileAccessService,
  type ProfileAccessEnvelope,
} from '@/lib/profile/passcode-server';
import { PRIVATE_NO_STORE_HEADERS } from '@/lib/profile/request-security';
import { ogPresentationForAccessMode } from '@/lib/profile/share-assets';

export const dynamic = 'force-dynamic';

const themes: Record<string, { background: string; foreground: string; accent: string }> = {
  sage: { background: '#edf3ed', foreground: '#1f2d24', accent: '#56745f' },
  ocean: { background: '#eaf3f7', foreground: '#172d3b', accent: '#35718c' },
  rose: { background: '#f8eeee', foreground: '#3f2228', accent: '#9b5968' },
  amber: { background: '#f8f1df', foreground: '#382b17', accent: '#a06c20' },
  slate: { background: '#eef0f3', foreground: '#20252d', accent: '#596677' },
};

const image = ({
  name,
  title,
  theme,
  protectedProfile = false,
}: {
  name?: string;
  title?: string;
  theme?: string;
  protectedProfile?: boolean;
}) => {
  const colors = themes[theme ?? 'sage'] ?? themes.sage;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        background: colors.background,
        color: colors.foreground,
      }}
    >
      <div style={{ display: 'flex', fontSize: 28, color: colors.accent }}>
        OpenCV Builder
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700 }}>
          {protectedProfile ? 'Protected profile' : name}
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: colors.accent }}>
          {protectedProfile
            ? 'A passcode is required to view this profile.'
            : title || 'Professional profile'}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: PRIVATE_NO_STORE_HEADERS,
    }
  );
};

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username') ?? '';
  const hostBinding = await resolveRequestHostBinding(request);
  if (
    hostBinding.kind === 'denied' ||
    !username ||
    username.length > 100 ||
    /[/?#%\\]/.test(username) ||
    (hostBinding.kind === 'custom' && hostBinding.username !== username)
  ) {
    return new Response(null, { status: 404, headers: PRIVATE_NO_STORE_HEADERS });
  }
  const profile = await fetchQuery(api.profiles.getProfileByUsername, {
    username,
  }).catch(() => null);
  if (profile && ogPresentationForAccessMode(profile.accessMode) === 'rich') {
    return image({
      name: profile.name,
      title: profile.title,
      theme: profile.colorTheme,
    });
  }
  const envelope = await profileAccessService<ProfileAccessEnvelope>('envelope', {
    username,
  }).catch(() => null);
  if (
    envelope?.ok &&
    envelope.data &&
    ogPresentationForAccessMode(envelope.data.mode) === 'protected'
  ) {
    return image({ protectedProfile: true });
  }
  return new Response(null, { status: 404, headers: PRIVATE_NO_STORE_HEADERS });
}
