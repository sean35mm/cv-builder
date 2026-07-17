import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { Document, HeadingLevel, Packer, Paragraph } from 'docx';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  atsDocumentToText,
  createAtsDocument,
  sanitizedExportFilename,
} from '@/lib/exports/ats';
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
import type { ProfileTranslationOverlay } from '@/lib/profile/locales';

const formats = new Set(['txt', 'json', 'docx']);

type ExportProfile = Record<string, unknown> & {
  username: string;
  sectionsVisibility?: Record<string, boolean>;
  locale?: string;
  defaultLocale?: string;
};
type ExportSource = {
  profile: ExportProfile;
  state: { sectionsVisibility: Record<string, boolean> };
  locale: string;
  overlay: ProfileTranslationOverlay | null;
};

const exportProfile = (value: unknown): ExportProfile | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return typeof record.username === 'string'
    ? (record as ExportProfile)
    : null;
};

const exportSource = (value: unknown): ExportSource | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const profile = exportProfile(record.profile);
  const state = record.state;
  if (
    !profile ||
    typeof record.locale !== 'string' ||
    !state ||
    typeof state !== 'object' ||
    Array.isArray(state) ||
    !(state as Record<string, unknown>).sectionsVisibility
  ) {
    return null;
  }
  return value as ExportSource;
};

const errorResponse = (status = 404) =>
  NextResponse.json(
    { error: 'Export is unavailable' },
    { status, headers: PRIVATE_NO_STORE_HEADERS }
  );

export async function GET(request: NextRequest) {
  const binding = await resolveRequestHostBinding(request);
  if (binding.kind === 'denied') return privateNoStoreNotFoundResponse();
  const username = request.nextUrl.searchParams.get('username') ?? '';
  const format = request.nextUrl.searchParams.get('format') ?? 'txt';
  const locale = request.nextUrl.searchParams.get('locale') ?? undefined;
  const versionId = request.nextUrl.searchParams.get('versionId') ?? undefined;
  if (
    !/^[A-Za-z0-9_-]{3,100}$/.test(username) ||
    !formats.has(format) ||
    (binding.kind === 'custom' && binding.username !== username)
  ) {
    return errorResponse(400);
  }
  try {
    const authToken = binding.kind === 'custom' ? null : await convexAuthNextjsToken();
    const ownerResult: unknown = authToken
      ? await fetchQuery(
          api.exports.getMySource,
          {
            locale,
            ...(versionId
              ? { versionId: versionId as Id<'resumeVersions'> }
              : {}),
          },
          { token: authToken }
        ).catch(() => null)
      : null;
    const ownerSource = exportSource(ownerResult);
    let profile: ExportProfile | null =
      ownerSource?.profile.username === username ? ownerSource.profile : null;
    let visibility: Record<string, boolean> | null = ownerSource
      ? ownerSource.state.sectionsVisibility
      : null;
    let resolvedLocale = ownerSource?.locale;
    let overlay = ownerSource?.overlay ?? null;

    if (!profile) {
      if (versionId) return errorResponse();
      const localizedResult: unknown = await fetchQuery(api.profileLocales.getByUsername, {
        username,
        locale,
      }).catch(() => null);
      const localized = exportProfile(localizedResult);
      if (localized) {
        profile = localized;
        visibility = localized.sectionsVisibility ?? null;
        resolvedLocale = localized.locale;
        overlay = null;
      }
    }

    if (!profile) {
      const envelopeResponse = await profileAccessService<ProfileAccessEnvelope>(
        'envelope',
        { username }
      ).catch(() => null);
      const envelope = envelopeResponse?.ok ? envelopeResponse.data : null;
      if (!envelope || envelope.mode !== 'passcode') return errorResponse();
      const token = grantTokenForUsername(
        request.cookies.get(PROFILE_GRANT_COOKIE)?.value,
        envelope.username
      );
      const ownerProfile = authToken
        ? await fetchQuery(api.profiles.getMyProfile, {}, { token: authToken }).catch(
            () => null
          )
        : null;
      const bundle = await profileAccessService<
        AuthorizedProfileBundle<ExportProfile, never>
      >('bundle', {
        username: envelope.username,
        ...(token ? { token } : {}),
        ...(ownerProfile?._id === envelope.profileId
          ? { ownerProfileId: ownerProfile._id }
          : {}),
        ...(locale ? { locale } : {}),
      }).catch(() => null);
      if (!bundle?.ok || !bundle.data) return errorResponse();
      profile = bundle.data.profile;
      visibility = profile.sectionsVisibility ?? null;
      resolvedLocale = profile.locale ?? profile.defaultLocale ?? 'en';
      overlay = null;
    }

    if (!profile || !visibility || !resolvedLocale) return errorResponse();
    const document = createAtsDocument(
      profile,
      visibility,
      resolvedLocale,
      overlay
    );
    const extension = format as 'txt' | 'json' | 'docx';
    const filename = sanitizedExportFilename(document.name, extension);
    const headers = {
      ...PRIVATE_NO_STORE_HEADERS,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff',
    };
    if (format === 'json') {
      return new NextResponse(`${JSON.stringify(document, null, 2)}\n`, {
        headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    if (format === 'txt') {
      return new NextResponse(`${atsDocumentToText(document)}\n`, {
        headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    const paragraphs = [
      new Paragraph({ text: document.name, heading: HeadingLevel.TITLE }),
      ...(document.headline ? [new Paragraph(document.headline)] : []),
      ...(document.summary ? [new Paragraph(document.summary)] : []),
      ...document.sections.flatMap((section) => [
        new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }),
        ...section.entries.map((entry) =>
          new Paragraph({ text: entry, bullet: { level: 0 } })
        ),
      ]),
    ];
    const buffer = await Packer.toBuffer(
      new Document({ sections: [{ properties: {}, children: paragraphs }] })
    );
    return new NextResponse(buffer, {
      headers: {
        ...headers,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });
  } catch {
    return errorResponse(400);
  }
}
