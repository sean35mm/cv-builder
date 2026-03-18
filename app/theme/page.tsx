'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { name: 'Sage', slug: 'sage' },
  { name: 'Ocean', slug: 'ocean' },
  { name: 'Rose', slug: 'rose' },
  { name: 'Amber', slug: 'amber' },
  { name: 'Slate', slug: 'slate' },
  { name: 'Sand', slug: 'sand' },
  { name: 'Cocoa', slug: 'cocoa' },
  { name: 'Peach', slug: 'peach' },
  { name: 'Forest', slug: 'forest' },
  { name: 'Olive', slug: 'olive' },
  { name: 'Teal', slug: 'teal' },
  { name: 'Mauve', slug: 'mauve' },
] as const;

function ProfilePreviewCard({ theme }: { theme: string }) {
  return (
    <div
      className={`theme-${theme} rounded-lg border bg-card p-8 text-card-foreground`}
    >
      <div className="mb-6">
        <div className="text-3xl font-serif font-semibold text-foreground">
          Sean Gil
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Senior Software Engineer &middot; Austin, TX
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5">
            Experience
          </div>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">
                  Senior Software Engineer
                </div>
                <div className="text-xs text-muted-foreground">
                  Hammer Media
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                2025 &ndash; Present
              </div>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">
                  Software Engineer, Frontend Lead
                </div>
                <div className="text-xs text-muted-foreground">Perigon</div>
              </div>
              <div className="text-xs text-muted-foreground">
                2024 &ndash; 2025
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5">
            Skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              'TypeScript',
              'React',
              'Next.js',
              'Vue',
              'Node',
              'PostgreSQL',
            ].map((s) => (
              <span
                key={s}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t pt-4">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-[11px] text-muted-foreground font-mono">
          opencv.app/@sean
        </span>
      </div>
    </div>
  );
}

export default function ThemePage() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const myProfile = useQuery(api.profiles.getMyProfile);
  const updateColorTheme = useMutation(api.profiles.updateColorTheme);
  const router = useRouter();
  const reduce = useReducedMotion();

  const currentTheme = (myProfile?.colorTheme ?? 'sage') as string;
  const [previewTheme, setPreviewTheme] = useState(currentTheme);

  useEffect(() => {
    setPreviewTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (loggedInUser === null) {
      router.replace('/');
    }
  }, [loggedInUser, router]);

  if (loggedInUser === undefined || loggedInUser === null) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </div>
    );
  }

  const handleSelect = async (slug: string) => {
    setPreviewTheme(slug);
    try {
      await updateColorTheme({
        colorTheme: slug as
          | 'sage'
          | 'ocean'
          | 'rose'
          | 'amber'
          | 'slate'
          | 'sand'
          | 'cocoa'
          | 'peach'
          | 'forest'
          | 'olive'
          | 'teal'
          | 'mauve',
      });
    } catch {
      setPreviewTheme(currentTheme);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-semibold text-foreground">
          Choose your theme
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick a color palette for your profile. This affects both your editor
          and public page.
        </p>
      </div>

      {/* Large preview */}
      <div className="mb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={previewTheme}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProfilePreviewCard theme={previewTheme} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Theme swatches */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {themes.map((t) => {
          const isActive = currentTheme === t.slug;
          const isPreviewing = previewTheme === t.slug;
          return (
            <button
              key={t.slug}
              onClick={() => void handleSelect(t.slug)}
              onMouseEnter={() => setPreviewTheme(t.slug)}
              onMouseLeave={() => setPreviewTheme(currentTheme)}
              className={cn(
                `theme-${t.slug}`,
                'group relative overflow-hidden rounded-lg border-2 text-left transition-all',
                isPreviewing
                  ? 'border-foreground scale-[1.03]'
                  : 'border-border hover:border-foreground/40'
              )}
              aria-label={`${t.name} theme${isActive ? ' (selected)' : ''}`}
            >
              {/* Color bands showing bg, primary, secondary */}
              <div className="flex h-10">
                <div className="flex-1 bg-background" />
                <div className="flex-1 bg-primary" />
                <div className="flex-1 bg-secondary" />
              </div>

              {/* Label */}
              <div className="flex items-center justify-between bg-card px-3 py-2">
                <span className="text-xs font-medium text-foreground">
                  {t.name}
                </span>
                {isActive && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
