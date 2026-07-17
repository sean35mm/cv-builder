import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { BrandLockup } from '@/components/platform/brand-lockup';

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
  const rawCursor = Array.isArray(params.cursor)
    ? params.cursor[0]
    : params.cursor;
  const cursor = rawCursor && rawCursor.length <= 2_000 ? rawCursor : undefined;
  const hasFilters = Boolean(query || skill);

  const result = await fetchQuery(api.directory.list, {
    ...(query ? { query } : {}),
    ...(skill ? { skill } : {}),
    ...(cursor ? { cursor } : {}),
    pageSize: 12,
  }).catch(() => null);

  return (
    <main
      className="platform-page min-h-screen"
      data-route-landmark="directory"
    >
      <header className="mb-12 border-b pb-10">
        <BrandLockup />
        <div className="platform-grid mt-16 gap-y-6">
          <p className="platform-kicker col-span-12 text-primary md:col-span-3">
            Public index / People
          </p>
          <div className="col-span-12 md:col-span-9">
            <h1 className="platform-section-title">
              People keeping a public record.
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              Search the profiles their owners chose to make discoverable.
            </p>
          </div>
        </div>
      </header>

      <form
        action="/directory"
        className="mb-10 grid gap-3 border-y py-4 sm:grid-cols-[1fr_220px_auto]"
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
            className="h-11 w-full rounded-[2px] border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
            className="h-11 w-full rounded-[2px] border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-[2px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Search
        </button>
      </form>

      {!result ? (
        <div role="alert" className="border-y border-destructive/50 py-8">
          <h2 className="font-medium">The directory is unavailable</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again shortly.
          </p>
        </div>
      ) : result.items.length === 0 ? (
        <div className="border-y py-12 text-center">
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
          <ol className="border-t" aria-label="Profiles">
            {result.items.map((profile, index) => (
              <li key={profile.username} className="border-b">
                <Link
                  href={`/@${profile.username}`}
                  className="platform-grid min-h-28 items-center gap-y-3 py-6 transition-colors duration-200 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="col-span-2 font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="col-span-10 sm:col-span-3">
                    <h2 className="font-serif text-2xl">{profile.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      @{profile.username}
                    </p>
                  </div>
                  {(profile.title || profile.industry) && (
                    <p className="col-span-10 col-start-3 text-sm sm:col-span-3 sm:col-start-auto">
                      {[profile.title, profile.industry]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  {profile.skills.length > 0 && (
                    <ul
                      className="col-span-10 col-start-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground sm:col-span-4 sm:col-start-auto"
                      aria-label="Skills"
                    >
                      {profile.skills.slice(0, 6).map((profileSkill) => (
                        <li key={profileSkill}>{profileSkill}</li>
                      ))}
                    </ul>
                  )}
                  <span
                    className="col-span-10 col-start-3 text-right sm:col-span-1 sm:col-start-auto"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {!result.isDone && result.continueCursor && (
            <nav
              className="mt-8 flex justify-center"
              aria-label="Directory pagination"
            >
              <Link
                href={directoryHref({
                  query,
                  skill,
                  cursor: result.continueCursor,
                })}
                className="inline-flex min-h-11 items-center rounded-[2px] border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
