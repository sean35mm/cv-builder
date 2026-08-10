import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { BrandLockup } from '@/components/platform/brand-lockup';

type GitHubRelease = {
  id: number;
  tag_name: string;
  name: string;
  body: string | null;
  published_at: string;
  html_url: string;
};

function isGitHubRelease(value: unknown): value is GitHubRelease {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const release = value as Record<string, unknown>;
  return (
    typeof release.id === 'number' &&
    typeof release.tag_name === 'string' &&
    typeof release.name === 'string' &&
    (typeof release.body === 'string' || release.body === null) &&
    typeof release.published_at === 'string' &&
    typeof release.html_url === 'string'
  );
}

async function getReleases(): Promise<GitHubRelease[]> {
  try {
    const response = await fetch(
      'https://api.github.com/repos/sean35mm/cv-builder/releases',
      {
        next: {
          revalidate: 3600, // Revalidate every hour
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releases: unknown = await response.json();
    return Array.isArray(releases) ? releases.filter(isGitHubRelease) : [];
  } catch (error) {
    console.error('Failed to fetch releases:', error);
    return [];
  }
}

export default async function ChangelogPage() {
  const releases = await getReleases();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandLockup />
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <header className="border-b border-border pb-10 pt-16 sm:pb-14 sm:pt-24">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Product updates
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.02em] text-foreground sm:text-6xl">
            Changelog
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Track the latest updates and improvements to OpenCV as we build in
            public.
          </p>
        </header>

        {releases.length === 0 ? (
          <div className="border-y border-border py-10 text-center sm:py-12">
            <h2 className="font-display text-xl font-semibold text-foreground">
              No releases found yet
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We are preparing our first release. Follow us on{' '}
              <a
                href="https://x.com/doughydev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                X (Twitter)
              </a>{' '}
              for updates.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {releases.map((release) => (
              <article
                key={release.id}
                className="flex flex-col py-8 first:pt-0"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                    {release.name || release.tag_name}
                  </h2>
                  <time
                    dateTime={release.published_at}
                    className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {formatDistanceToNow(new Date(release.published_at), {
                      addSuffix: true,
                    })}
                  </time>
                </div>

                {release.body ? (
                  <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-foreground/85">
                    {release.body}
                  </p>
                ) : (
                  <p className="mt-5 italic text-muted-foreground">
                    No release notes provided.
                  </p>
                )}

                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-5 text-sm font-medium text-accent transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  View on GitHub
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        )}

        <div className="mb-8 mt-12 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            OpenCV is open source. Follow our development on{' '}
            <a
              href="https://github.com/sean35mm/cv-builder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-2 hover:underline"
            >
              GitHub
            </a>{' '}
            and join the conversation on{' '}
            <a
              href="https://x.com/doughydev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-2 hover:underline"
            >
              X (Twitter)
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
