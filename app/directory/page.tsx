import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

const textParam = (value: string | string[] | undefined, maxLength: number) => {
  const text = Array.isArray(value) ? value[0] : value;
  return text?.trim().replace(/\s+/g, ' ').slice(0, maxLength) || undefined;
};

const directoryHref = ({
  query,
  skill,
  cursor,
}: {
  query?: string;
  skill?: string;
  cursor?: string | null;
}) => {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (skill) params.set('skill', skill);
  if (cursor) params.set('cursor', cursor);
  const search = params.toString();
  return search ? `/directory?${search}` : '/directory';
};

type DirectorySearchParams = {
  q?: string | string[];
  skill?: string | string[];
  cursor?: string | string[];
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Boolean(params.q || params.skill || params.cursor);
  return {
    title: 'Public Profile Directory',
    description: 'Discover public OpenCV profiles shared by their owners.',
    alternates: { canonical: '/directory' },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  const params = await searchParams;
  const query = textParam(params.q, 80);
  const skill = textParam(params.skill, 50);
  const rawCursor = Array.isArray(params.cursor) ? params.cursor[0] : params.cursor;
  const cursor =
    rawCursor && rawCursor.length <= 2_000 ? rawCursor : undefined;
  const hasFilters = Boolean(query || skill);

  const result = await fetchQuery(api.directory.list, {
    ...(query ? { query } : {}),
    ...(skill ? { skill } : {}),
    ...(cursor ? { cursor } : {}),
    pageSize: 12,
  }).catch(() => null);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 space-y-3">
        <Link
          href="/"
          className="font-serif text-lg font-semibold transition-colors hover:text-primary"
        >
          OpenCV
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Public profile directory
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Discover profiles that their owners have chosen to list publicly.
        </p>
      </header>

      <form
        action="/directory"
        className="mb-8 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_220px_auto]"
      >
        <div>
          <label htmlFor="directory-query" className="sr-only">
            Search profiles
          </label>
          <input
            id="directory-query"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={80}
            placeholder="Search name, username, role, industry, or skills"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="directory-skill" className="sr-only">
            Filter by exact skill
          </label>
          <input
            id="directory-skill"
            name="skill"
            type="search"
            defaultValue={skill}
            maxLength={50}
            placeholder="Exact skill filter"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Search
        </button>
      </form>

      {!result ? (
        <div role="alert" className="rounded-lg border border-destructive/50 p-6">
          <h2 className="font-medium">The directory is unavailable</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again shortly.
          </p>
        </div>
      ) : result.items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h2 className="font-medium">No profiles found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? 'Try a different search or remove the skill filter.'
              : 'No profiles have been listed yet.'}
          </p>
          {hasFilters && (
            <Link
              href="/directory"
              className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Profiles">
            {result.items.map((profile) => (
              <li key={profile.username}>
                <Link
                  href={`/@${profile.username}`}
                  className="block h-full rounded-lg border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <h2 className="font-semibold">{profile.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                  {(profile.title || profile.industry) && (
                    <p className="mt-3 text-sm">
                      {[profile.title, profile.industry].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {profile.skills.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
                      {profile.skills.slice(0, 6).map((profileSkill) => (
                        <li
                          key={profileSkill}
                          className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                        >
                          {profileSkill}
                        </li>
                      ))}
                    </ul>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {!result.isDone && result.continueCursor && (
            <nav className="mt-8 flex justify-center" aria-label="Directory pagination">
              <Link
                href={directoryHref({
                  query,
                  skill,
                  cursor: result.continueCursor,
                })}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Next page
              </Link>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
