import { redirect } from 'next/navigation';

// Profile locales are not offered; old localized links land on the profile.
export default async function LocalizedProfileRedirect({
  params,
}: {
  params: Promise<{ username: string; locale: string }>;
}) {
  const { username } = await params;
  redirect(`/u/${encodeURIComponent(username)}`);
}
