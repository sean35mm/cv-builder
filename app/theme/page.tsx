'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const THEMES = [
  'sage',
  'ocean',
  'rose',
  'amber',
  'slate',
  'sand',
  'cocoa',
  'peach',
  'forest',
  'olive',
  'teal',
  'mauve',
] as const;

export default function ThemePage() {
  const router = useRouter();
  const user = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);
  const updateColorTheme = useMutation(api.profiles.updateColorTheme);

  useEffect(() => {
    if (user === null) {
      router.replace('/login');
    }
  }, [user, router]);

  const current = useMemo(() => profile?.colorTheme ?? 'sage', [profile]);

  if (user === undefined || profile === undefined) {
    return null;
  }
  if (user === null) {
    return null;
  }

  const handleChoose = async (slug: (typeof THEMES)[number]) => {
    if (slug === current) return;
    await updateColorTheme({ colorTheme: slug });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-foreground">
        Choose your color theme
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Each theme supports light and dark mode. Your selection applies across
        your editor and public profile.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {THEMES.map((slug) => (
          <Card
            key={slug}
            className={cn(
              'px-6 py-4 border cursor-pointer transition-shadow hover:shadow-sm',
              `theme-${slug}`
            )}
            onClick={() => void handleChoose(slug)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-foreground font-medium capitalize">
                {slug}
              </div>
              {current === slug ? (
                <span className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
                  Selected
                </span>
              ) : null}
            </div>
            {/* Preview block uses CSS vars from theme class */}
            <div className="space-y-3 pr-2">
              <div className="rounded-lg border bg-card text-card-foreground p-3">
                <div className="font-medium">Card</div>
                <div className="text-xs text-muted-foreground">
                  Foreground, muted
                </div>
              </div>
              <div className="inline-flex items-center gap-3">
                <Button
                  size="sm"
                  className="h-7 px-2 text-xs rounded-md bg-primary text-primary-foreground"
                >
                  Primary
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs rounded-md"
                >
                  Secondary
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs rounded-md"
                >
                  Outline
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary" />
                <span className="w-5 h-5 rounded-full bg-accent" />
                <span className="w-5 h-5 rounded-full bg-muted" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
