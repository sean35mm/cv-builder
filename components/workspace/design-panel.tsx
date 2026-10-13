'use client';

import { PALETTES, resolvePaletteId, type PaletteId } from '@/lib/palettes';
import { resolveTemplateId, TEMPLATES, type TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';

const optionClassName =
  'cursor-pointer rounded-md transition-colors duration-150 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring';

// Selected-state dot for a visually hidden native radio (the `peer`).
const radioDotClassName =
  'mt-0.5 size-3.5 shrink-0 rounded-full border border-border-strong bg-surface transition-[border-width,border-color] duration-150 ease-out peer-checked:border-4 peer-checked:border-foreground';

export function DesignPanel({
  templateId,
  colorTheme,
  onTemplateChange,
  onPaletteChange,
}: {
  templateId: unknown;
  colorTheme: unknown;
  onTemplateChange: (id: TemplateId) => void;
  onPaletteChange: (id: PaletteId) => void;
}) {
  const template = resolveTemplateId(templateId);
  const palette = resolvePaletteId(colorTheme);

  return (
    <div className="space-y-8 p-4">
      <fieldset>
        <legend className="mb-2 text-[12px] font-medium text-muted-foreground">
          Template
        </legend>
        <div className="space-y-1">
          {TEMPLATES.map((option) => (
            <label
              key={option.id}
              className={cn(
                optionClassName,
                'flex gap-2.5 border px-3 py-2.5',
                option.id === template
                  ? 'border-border-strong bg-secondary/60'
                  : 'border-transparent hover:bg-secondary/60'
              )}
            >
              <input
                type="radio"
                name="template"
                value={option.id}
                checked={option.id === template}
                onChange={() => onTemplateChange(option.id)}
                className="peer sr-only"
              />
              <span aria-hidden="true" className={radioDotClassName} />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">
                  {option.name}
                </span>
                <span className="mt-0.5 block text-[12px] leading-[18px] text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[12px] font-medium text-muted-foreground">
          Color
        </legend>
        <div className="grid grid-cols-2 gap-1">
          {PALETTES.map((option) => (
            <label
              key={option.id}
              className={cn(
                optionClassName,
                'flex h-8 items-center gap-2 border px-2 pointer-coarse:h-11',
                option.id === palette
                  ? 'border-border-strong bg-secondary/60 text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              <input
                type="radio"
                name="palette"
                value={option.id}
                checked={option.id === palette}
                onChange={() => onPaletteChange(option.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="size-3.5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
                style={{ backgroundColor: option.swatch }}
              />
              <span className="text-[12.5px]">{option.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
