import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await params;

  try {
    const version = await fetchQuery(api.versions.getVersionDetails, {
      versionId: versionId as any,
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: version._id,
      name: version.name,
      sectionsVisibility: version.sectionsVisibility,
      sectionsOrder: version.sectionsOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}
