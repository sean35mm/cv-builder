import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { notFound } from 'next/navigation';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storageId: string }> }
) {
  const { storageId } = await params;

  const url = await fetchQuery(api.storage.getImageUrl, {
    storageId: storageId as any,
  });

  if (!url) {
    return notFound();
  }

  return Response.redirect(url);
}
