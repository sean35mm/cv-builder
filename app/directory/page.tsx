import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { BrandLockup } from '@/components/platform/brand-lockup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

const monogramFor = (name: string, username: string) => {
  const source = name.trim() || username;
  const initials = source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return { initials };
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
      className="mx-auto min-h-screen max-w-[88rem] px-4 py-6 sm:px-6 md:py-8 lg:px-10"
      data-route-landmark="directory"
    >
      <header className="mb-10">
        <BrandLockup className="group-data-[workspace-chrome=true]/app-shell:hidden" />
        <div className="mt-16 max-w-3xl border-b border-border pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Directory
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.02em] sm:text-6xl">
            People on the record.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Public profiles shared by people who chose to be discoverable.
          </p>
        </div>
      </header>

      <form
        action="/directory"
        className="sticky top-14 z-20 mb-10 grid gap-3 border-y border-border bg-background py-3 sm:grid-cols-[1fr_220px_auto]"
      >
        <div>
          <label htmlFor="directory-query" className="sr-only">
            Search profiles
          </label>
          <Input
            id="directory-query"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={80}
            placeholder="Search name, username, role, industry, or skill"
            className="h-11"
          />
        </div>
        <div>
          <label htmlFor="directory-skill" className="sr-only">
            Filter by exact skill
          </label>
          <Input
            id="directory-skill"
            name="skill"
            type="search"
            defaultValue={skill}
            maxLength={50}
            placeholder="Filter by exact skill"
            className="h-11"
          />
        </div>
        <Button type="submit" className="h-11">
          Search
        </Button>
      </form>

      {!result ? (
        <div
          role="alert"
          className="border-y border-border py-8 text-destructive"
        >
          <h2 className="font-medium">The directory is unavailable</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again shortly.
          </p>
        </div>
      ) : result.items.length === 0 ? (
        <div className="border-y border-border py-16 text-center">
          <h2 className="font-medium">No public profiles found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? 'Try a different search or remove the skill filter.'
              : 'No public profiles have been listed yet.'}
          </p>
          {hasFilters && (
            <Link
              href="/directory"
              className="mt-4 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <>
          <ol
            className="grid border-t border-border sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3"
            aria-label="Profiles"
          >
            {result.items.map((profile) => {
              const monogram = monogramFor(profile.name, profile.username);
              return (
                <li key={profile.username} className="border-b border-border">
                  <Link
                    href={`/@${profile.username}`}
                    className="group flex h-full flex-col py-6 transition-colors duration-150 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className="flex aspect-[4/3] w-full items-end bg-secondary p-5 font-display text-5xl font-semibold text-foreground"
                      aria-hidden="true"
                    >
                      {monogram.initials}
                    </span>
                    <div className="mt-5">
                      <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
                        {profile.name}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        @{profile.username}
                      </p>
                    </div>
                    {(profile.title || profile.industry) && (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        {[profile.title, profile.industry]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    {profile.skills.length > 0 && (
                      <ul
                        className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground"
                        aria-label="Skills"
                      >
                        {profile.skills.slice(0, 6).map((profileSkill) => (
                          <li
                            key={profileSkill}
                            className="rounded border border-border px-2.5 py-1"
                          >
                            {profileSkill}
                          </li>
                        ))}
                      </ul>
                    )}
                    <span
                      className="mt-auto pt-5 text-sm font-medium text-accent"
                      aria-hidden="true"
                    >
                      View profile →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {!result.isDone && result.continueCursor && (
            <nav
              className="mt-8 flex justify-center"
              aria-label="Directory pagination"
            >
              <Button variant="outline" asChild>
                <Link
                  href={directoryHref({
                    query,
                    skill,
                    cursor: result.continueCursor,
                  })}
                >
                  Next page
                </Link>
              </Button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
