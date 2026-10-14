'use client';

import { useEffect, useRef, useState } from 'react';
import { AMARA, KEN, NOOR } from '@/components/landing/samples';
import { ProfileDocument } from '@/components/profile/profile-document';
import { PALETTES, type PaletteId } from '@/lib/palettes';
import { TEMPLATES, type TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';

// Cards render real profiles at a desktop width, so each template keeps its
// own layout, then scale down to card size.
const DOC_WIDTH = 800;
const CARD_SHARE = 0.56;

// Back cards first so the Editorial card sits on top.
const CARDS = [
  {
    profile: AMARA,
    templateId: 'modern',
    paletteId: 'sage',
    style: { '--x': '-30%', '--r': '-7deg', '--hx': '-40%', '--hr': '-11deg' },
    delay: 80,
  },
  {
    profile: KEN,
    templateId: 'minimal',
    paletteId: 'ocean',
    // One dark card shows that every palette has a dark mode.
    dark: true,
    style: { '--x': '30%', '--r': '8deg', '--hx': '40%', '--hr': '12deg' },
    delay: 160,
  },
  {
    profile: NOOR,
    templateId: 'classic',
    paletteId: 'rose',
    style: { '--x': '0%', '--r': '0deg', '--hx': '0%', '--hr': '-1deg' },
    delay: 0,
  },
] as const satisfies readonly {
  profile: typeof NOOR;
  templateId: TemplateId;
  paletteId: PaletteId;
  dark?: boolean;
  style: Record<string, string>;
  delay: number;
}[];

export function HeroFan() {
  const fanRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(520);
  const [paletteId, setPaletteId] = useState<PaletteId | null>(null);

  useEffect(() => {
    const node = fanRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = (width * CARD_SHARE) / DOC_WIDTH;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={fanRef}
        role="img"
        aria-label="Three example profiles, one in each template: Editorial, Rail and Ledger"
        className="group relative aspect-[6/5] w-full max-w-[560px]"
      >
        {CARDS.map((card) => {
          const template = TEMPLATES.find(
            (item) => item.id === card.templateId
          );
          return (
            <div
              key={card.templateId}
              inert
              className={cn(
                'absolute left-1/2 top-[3%] aspect-[3/4] w-[56%] translate-x-[calc(-50%+var(--x))] rotate-(--r) animate-fan-in overflow-hidden rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_30px_60px_-24px_rgb(40_30_20/0.4)] transition-[translate,rotate] duration-500 ease-out group-hover:translate-x-[calc(-50%+var(--hx))] group-hover:rotate-(--hr) dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_30px_60px_-24px_rgb(0_0_0/0.8)]',
                'dark' in card && card.dark && 'dark'
              )}
              style={{ ...card.style, animationDelay: `${card.delay}ms` }}
            >
              <div
                className="@container"
                style={{
                  width: DOC_WIDTH,
                  height: DOC_WIDTH * (4 / 3),
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                }}
              >
                <ProfileDocument
                  profile={card.profile}
                  templateId={card.templateId}
                  colorTheme={paletteId ?? card.paletteId}
                  className="h-full transition-colors duration-300"
                />
              </div>
              <span className="absolute bottom-2.5 right-2.5 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-[0_0_0_1px_var(--border)] backdrop-blur">
                {template?.name}
              </span>
            </div>
          );
        })}
      </div>

      <div
        role="group"
        aria-label="Preview a palette"
        className="mt-2 flex items-center gap-0.5"
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
              onClick={() => setPaletteId(active ? null : palette.id)}
              className="group/dot grid size-7 place-items-center rounded-full pointer-coarse:size-10"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-3.5 rounded-full ring-offset-2 ring-offset-background transition-transform duration-150 ease-out group-hover/dot:scale-110',
                  active ? 'ring-1 ring-foreground' : 'ring-0'
                )}
                style={{ backgroundColor: palette.swatch }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
