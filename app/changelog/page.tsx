import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string | null;
  published_at: string;
  html_url: string;
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

    const releases = await response.json();
    return releases;
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

          <div className="p-8 bg-muted/50 rounded-lg text-center">
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
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(release.body),
                  }}
                />
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

        <div className="mt-16 p-6 bg-muted/50 rounded-lg">
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

// Simple markdown renderer for release notes
function renderMarkdown(body: string): string {
  return body
    .replace(
      /## (.*$)/gim,
      '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>'
    )
    .replace(
      /### (.*$)/gim,
      '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>'
    )
    .replace(
      /^> (.*$)/gim,
      '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>'
    )
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(
      /```([\s\S]*?)```/gim,
      '<pre class="bg-muted p-3 rounded my-4 overflow-x-auto"><code>$1</code></pre>'
    )
    .replace(
      /`([^`]+)`/gim,
      '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
    )
    .replace(/\n\* (.*)/gim, '<li>$1</li>')
    .replace(
      /<li>(.*)<\/li>/gim,
      '<ul class="list-disc pl-6 my-4 space-y-1">$&</ul>'
    )
    .replace(/\n$/gim, '<br />')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/gim,
      '<a href="$2" class="text-primary hover:underline">$1</a>'
    );
}
