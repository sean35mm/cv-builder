import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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

  if (releases.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              ← Back to Home
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-4 text-foreground">Changelog</h1>
          <p className="text-muted-foreground mb-12">
            Track the latest updates and improvements to OpenCV as we build in
            public.
          </p>

          <div className="border-y bg-muted/50 py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No releases found yet. Check back soon!
            </p>
            <p className="text-sm text-muted-foreground">
              We are preparing our first release. Follow us on{' '}
              <a
                href="https://x.com/doughydev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-2 hover:underline"
              >
                X (Twitter)
              </a>{' '}
              for updates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            ← Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4 text-foreground">Changelog</h1>
        <p className="text-muted-foreground mb-12">
          Track the latest updates and improvements to OpenCV as we build in
          public.
        </p>

        <div className="space-y-12">
          {releases.map((release) => (
            <article
              key={release.id}
              className="border-b border-border pb-12 last:border-0"
            >
              <div className="flex items-baseline gap-4 mb-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  {release.name || release.tag_name}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(release.published_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {release.body ? (
                <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                  {release.body}
                </p>
              ) : (
                <p className="text-muted-foreground italic">
                  No release notes provided.
                </p>
              )}

              <a
                href={release.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View on GitHub
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </article>
          ))}
        </div>

        <div className="mt-16 border-y bg-muted/50 py-6">
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
      </div>
    </div>
  );
}
