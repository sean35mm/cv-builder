'use client';

import { useEffect, useRef, useState } from 'react';
import { ProfileDocument } from '@/components/profile/profile-document';
import type { ProfileContent } from '@/lib/types';
import { PALETTES, type PaletteId } from '@/lib/palettes';
import { TEMPLATES, type TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';

// Profiles lay out by container width, so the specimen renders at a desktop
// width and scales down as a whole on narrow screens.
const DOC_WIDTH = 1040;
const DOC_HEIGHT = 720;

const SAMPLE: ProfileContent = {
  username: 'noor',
  name: 'Noor Haddad',
  title: 'Staff software engineer, payments',
  location: 'Lisbon, Portugal',
  bio: 'I build the unglamorous systems money moves through: ledgers, reconciliation, payouts. I care about boring correctness, clear runbooks, and code a new teammate can read on their first day.',
  experience: [
    {
      id: 'tessera',
      role: 'Staff software engineer',
      company: 'Tessera',
      startDate: '2022-03',
      current: true,
      description:
        'Lead the ledger team of six. Rebuilt month-end reconciliation so finance closes in two days instead of nine, and moved payouts to an idempotent job queue with zero double-sends since launch.',
    },
    {
      id: 'fieldnote',
      role: 'Senior software engineer',
      company: 'Fieldnote',
      startDate: '2018-06',
      endDate: '2022-02',
      current: false,
      description:
        'Owned offline sync for the mobile apps. Designed the conflict model and the test harness that replays a year of real edit histories before every release.',
    },
    {
      id: 'kiln',
      role: 'Software engineer',
      company: 'Kiln CI',
      startDate: '2015-09',
      endDate: '2018-05',
      current: false,
      description:
        'Built the remote build cache. Median pipeline time fell from 14 minutes to 6.',
    },
  ],
  education: [
    {
      id: 'porto',
      degree: 'BSc, Computer Science',
      school: 'University of Porto',
      startDate: '2011-09',
      endDate: '2015-06',
      current: false,
    },
  ],
  skills: [
    'TypeScript',
    'Rust',
    'PostgreSQL',
    'Distributed systems',
    'Payments',
    'Technical writing',
  ],
  languages: [
    { id: 'ar', name: 'Arabic', proficiency: 'native' },
    { id: 'en', name: 'English', proficiency: 'fluent' },
    { id: 'pt', name: 'Portuguese', proficiency: 'professional' },
  ],
  projects: [
    {
      id: 'ledgerlint',
      title: 'ledgerlint',
      year: '2024',
      description:
        'Open-source linter for double-entry schemas. Flags unbalanced postings and missing currency columns before they reach production.',
      technologies: ['Rust', 'PostgreSQL'],
      isFeatured: true,
    },
    {
      id: 'quiet-hours',
      title: 'Quiet Hours',
      year: '2021',
      description:
        'A small macOS utility that holds notifications until your calendar is clear.',
      technologies: ['Swift'],
    },
  ],
  publications: [
    {
      id: 'reconciliation',
      title: 'Reconciliation without the spreadsheet',
      publisher: 'Tessera engineering blog',
      date: '2023-10',
    },
  ],
  certifications: [],
  volunteering: [],
  exhibitions: [],
  awards: [],
  interests: [],
};

const segmentClass =
  'h-7 rounded-[5px] px-2.5 text-[12.5px] font-medium transition-[background-color,color] duration-150 ease-out pointer-coarse:h-10';

export function Specimen() {
  const [templateId, setTemplateId] = useState<TemplateId>('classic');
  const [paletteId, setPaletteId] = useState<PaletteId>('slate');
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DOC_WIDTH);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(1, width / DOC_WIDTH);
  const template = TEMPLATES.find((item) => item.id === templateId);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex h-10 items-center justify-center border-b border-border px-3">
          <span className="max-w-full truncate rounded-md bg-secondary px-3 py-1 font-mono text-[12px] text-muted-foreground">
            opencv.app/u/{SAMPLE.username}
          </span>
        </div>
        <div
          ref={viewportRef}
          className="overflow-hidden"
          style={{ height: DOC_HEIGHT * scale }}
        >
          <div
            key={templateId}
            role="region"
            aria-label={`Example profile in the ${template?.name} template`}
            tabIndex={0}
            className="scroll-quiet animate-in fade-in-0 overflow-y-auto duration-200 ease-out focus-visible:outline-offset-[-2px]"
            style={{
              width: Math.max(width, DOC_WIDTH),
              height: DOC_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
            }}
          >
            <div inert className="@container min-h-full">
              <ProfileDocument
                profile={SAMPLE}
                templateId={templateId}
                colorTheme={paletteId}
                className="min-h-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div
          role="group"
          aria-label="Template"
          className="inline-flex rounded-md border border-border bg-surface p-0.5"
        >
          {TEMPLATES.map((item) => {
            const active = item.id === templateId;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTemplateId(item.id)}
                className={cn(
                  segmentClass,
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        <div
          role="group"
          aria-label="Palette"
          className="flex items-center gap-0.5"
        >
          {PALETTES.map((palette) => {
            const active = palette.id === paletteId;
            return (
              <button
                key={palette.id}
                type="button"
                aria-pressed={active}
                aria-label={palette.name}
                title={palette.name}
                onClick={() => setPaletteId(palette.id)}
                className="group grid size-7 place-items-center rounded-full pointer-coarse:size-10"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-3.5 rounded-full ring-offset-2 ring-offset-background transition-transform duration-150 ease-out group-hover:scale-110',
                    active ? 'ring-1 ring-foreground' : 'ring-0'
                  )}
                  style={{ backgroundColor: palette.swatch }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
