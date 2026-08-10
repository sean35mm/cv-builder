'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ClassicView } from '@/components/templates/classic-view';
import { ModernView } from '@/components/templates/modern-view';
import { MinimalView } from '@/components/templates/minimal-view';
import { DeveloperView } from '@/components/templates/developer-view';
import { CreativeView } from '@/components/templates/creative-view';
import type { ProfileContent } from '@/lib/types';
import { TEMPLATES, type TemplateId } from '@/lib/templates';

const palettes = [
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

type PaletteSlug = (typeof palettes)[number];

const defaultPaletteFor: Record<TemplateId, PaletteSlug> = {
  classic: 'sage',
  modern: 'ocean',
  minimal: 'sand',
  developer: 'slate',
  creative: 'rose',
};

const specimenProfile: ProfileContent = {
  username: 'mira',
  name: 'Mira Karlsen',
  title: 'Industrial Designer',
  location: 'Copenhagen, DK',
  bio: 'Eleven years designing furniture, lighting, and quiet household objects. Interested in material restraint and things that age well.',
  email: 'mira@opencv.app',
  website: 'mirakarlsen.studio',
  github: 'mirakarlsen',
  linkedin: 'mira-karlsen',
  experience: [
    {
      id: 'e1',
      role: 'Senior Industrial Designer',
      company: 'Atlas Studio',
      startDate: '2021-03',
      endDate: undefined,
      current: true,
      description:
        'Lead the form, prototyping, and sourcing for two lighting collections released each year.',
    },
    {
      id: 'e2',
      role: 'Industrial Designer',
      company: 'Feldt & Co.',
      startDate: '2016-09',
      endDate: '2021-02',
      current: false,
      description:
        'Designed furniture for contract interiors. Ran the materials library and supplier relationships across Northern Europe.',
    },
  ],
  education: [
    {
      id: 'd1',
      degree: 'MA, Industrial Design',
      school: 'Royal Danish Academy',
      startDate: '2012-09',
      endDate: '2014-06',
      current: false,
    },
  ],
  skills: ['Furniture', 'Lighting', 'Soft goods', 'Prototyping', 'Sourcing'],
  languages: [
    { id: 'l1', name: 'Danish', proficiency: 'native' },
    { id: 'l2', name: 'English', proficiency: 'fluent' },
    { id: 'l3', name: 'German', proficiency: 'conversational' },
  ],
  projects: [
    {
      id: 'p1',
      title: 'Tide Lamp',
      year: '2024',
      company: 'Atlas Studio',
      description:
        'A cast-aluminium task lamp with one machined seam. Released at Stockholm Furniture & Light Fair.',
      technologies: ['Cast aluminium', 'CNC', 'Assembly design'],
      category: 'Lighting',
      isFeatured: true,
    },
    {
      id: 'p2',
      title: 'Linen Lounge Chair',
      year: '2022',
      company: 'Atlas Studio',
      description:
        'Steam-bent ash frame with woven linen. Two-year development with a small workshop in Jutland.',
      technologies: ['Ash', 'Linen', 'Steam bending'],
      category: 'Furniture',
    },
  ],
  publications: [],
  certifications: [],
  volunteering: [],
  exhibitions: [
    {
      id: 'x1',
      title: 'Three Quiet Objects',
      venue: 'Glasshuset',
      year: '2023',
      location: 'Copenhagen',
    },
  ],
  awards: [
    {
      id: 'a1',
      title: 'iF Design Award',
      issuer: 'iF Design Foundation',
      year: '2023',
    },
  ],
  interests: ['Ceramics', 'Letterpress', 'Long walks'],
};

function renderTemplate(id: TemplateId, profile: ProfileContent) {
  switch (id) {
    case 'classic':
      return <ClassicView profile={profile} />;
    case 'modern':
      return <ModernView profile={profile} />;
    case 'minimal':
      return <MinimalView profile={profile} />;
    case 'developer':
      return <DeveloperView profile={profile} />;
    case 'creative':
      return <CreativeView profile={profile} />;
  }
}

export function HeroSpecimen() {
  const reduceMotion = useReducedMotion();
  const [templateIndex, setTemplateIndex] = useState(0);
  const [palette, setPalette] = useState<PaletteSlug>(
    defaultPaletteFor[TEMPLATES[0].id]
  );
  const [manualPaused, setManualPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const shouldPause =
    manualPaused || interactionPaused || Boolean(reduceMotion);

  useEffect(() => {
    if (shouldPause) return;
    const timer = window.setInterval(() => {
      setTemplateIndex((i) => {
        const next = (i + 1) % TEMPLATES.length;
        setPalette(defaultPaletteFor[TEMPLATES[next].id]);
        return next;
      });
    }, 6000);
    return () => window.clearInterval(timer);
  }, [shouldPause]);

  const template = TEMPLATES[templateIndex];

  return (
    <div className="relative w-full">
      <div
        className="absolute -right-2 -top-2 h-full w-full bg-accent"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden border border-border bg-card">
        <div className="flex min-h-11 items-center gap-3 border-b border-border bg-background px-4 py-2">
          <span className="font-display text-sm font-medium">Live profile</span>
          <span className="ml-auto hidden font-mono text-xs text-muted-foreground sm:inline">
            opencv.app/@mira
          </span>
          <button
            type="button"
            aria-pressed={manualPaused || Boolean(reduceMotion)}
            disabled={Boolean(reduceMotion)}
            onClick={() => setManualPaused((paused) => !paused)}
            className="inline-flex min-h-11 items-center px-2 font-mono text-xs text-muted-foreground transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reduceMotion
              ? 'Preview paused'
              : manualPaused
                ? 'Resume preview'
                : 'Pause preview'}
          </button>
        </div>

        <div
          className="relative max-h-[30rem] overflow-y-auto overscroll-contain scrollbar-hide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          tabIndex={0}
          role="region"
          aria-label="Profile template preview"
          onMouseEnter={() => setInteractionPaused(true)}
          onMouseLeave={() => setInteractionPaused(false)}
          onFocus={() => setInteractionPaused(true)}
          onBlur={() => setInteractionPaused(false)}
        >
          <div
            key={`${template.id}-${palette}`}
            className={`profile-theme theme-${palette} w-full animate-[specimen-fade_400ms_ease-out]`}
            inert
            aria-hidden="true"
          >
            {renderTemplate(template.id, specimenProfile)}
          </div>
        </div>
      </div>

      <div className="relative mt-4 space-y-3 bg-background/95 py-1">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-labelledby="specimen-template-label"
        >
          <span
            id="specimen-template-label"
            className="mr-1 font-mono text-xs text-muted-foreground"
          >
            Template
          </span>
          {TEMPLATES.map((item, i) => {
            const active = i === templateIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTemplateIndex(i);
                  setPalette(defaultPaletteFor[item.id]);
                  setManualPaused(true);
                }}
                aria-pressed={active}
                className={cn(
                  'min-h-11 px-3 font-mono text-xs transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-labelledby="specimen-palette-label"
        >
          <span
            id="specimen-palette-label"
            className="mr-1 font-mono text-xs text-muted-foreground"
          >
            Palette
          </span>
          {palettes.map((slug) => {
            const active = slug === palette;
            return (
              <button
                key={slug}
                type="button"
                title={slug[0].toUpperCase() + slug.slice(1)}
                onClick={() => {
                  setPalette(slug);
                  setManualPaused(true);
                }}
                aria-label={`Apply ${slug} palette`}
                aria-pressed={active}
                className={`profile-theme theme-${slug} inline-flex size-11 items-center justify-center transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]`}
              >
                <span
                  className={cn(
                    'grid h-5 w-7 grid-cols-3 overflow-hidden border',
                    active
                      ? 'border-foreground/60 ring-2 ring-foreground/10'
                      : 'border-border/70 hover:border-border'
                  )}
                  aria-hidden="true"
                >
                  <span className="bg-background" />
                  <span className="bg-primary" />
                  <span className="bg-accent" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
