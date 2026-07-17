'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Check } from 'lucide-react';
import {
  resolveTemplateId,
  TEMPLATES,
  type TemplateId,
} from '@/lib/templates';
import { toast } from 'sonner';
import { useState } from 'react';

type TemplateSelectorProps = {
  currentTemplate?: unknown;
  onTemplateChange?: (templateId: TemplateId) => void;
};

function TemplatePreview({ templateId }: { templateId: TemplateId }) {
  if (templateId === 'classic') {
    return (
      <div className="grid h-full grid-cols-[1fr_2fr] gap-2 p-3" aria-hidden>
        <div className="space-y-2 border-r border-border pr-2">
          <span className="block h-2 w-3/4 bg-primary/50" />
          <span className="block h-1 w-full bg-muted-foreground/30" />
          <span className="block h-1 w-4/5 bg-muted-foreground/30" />
        </div>
        <div className="space-y-2">
          <span className="block h-3 w-4/5 bg-foreground/70" />
          <span className="block h-px w-full bg-border" />
          <span className="block h-1 w-full bg-muted-foreground/30" />
          <span className="block h-1 w-3/4 bg-muted-foreground/30" />
        </div>
      </div>
    );
  }

  if (templateId === 'modern') {
    return (
      <div className="flex h-full flex-col items-center gap-2 p-3" aria-hidden>
        <span className="block h-3 w-1/2 bg-foreground/70" />
        <span className="block h-1 w-1/3 bg-primary/70" />
        <div className="mt-1 grid w-full grid-cols-2 gap-2">
          <span className="h-7 rounded border border-border bg-muted/70" />
          <span className="h-7 rounded border border-border bg-muted/70" />
        </div>
        <span className="block h-1 w-4/5 bg-muted-foreground/30" />
      </div>
    );
  }

  if (templateId === 'minimal') {
    return (
      <div className="flex h-full flex-col justify-center gap-3 px-5" aria-hidden>
        <span className="block h-4 w-4/5 bg-foreground/65" />
        <span className="block h-1 w-2/5 bg-muted-foreground/30" />
        <div className="mt-2 space-y-2">
          <span className="block h-px w-full bg-border" />
          <span className="block h-1 w-3/4 bg-muted-foreground/25" />
        </div>
      </div>
    );
  }

  if (templateId === 'developer') {
    return (
      <div className="h-full p-3 font-mono" aria-hidden>
        <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
          <span className="block h-2 w-2/5 bg-foreground/70" />
          <span className="block h-1 w-1/5 bg-primary" />
        </div>
        <div className="grid grid-cols-[24px_1fr] gap-2 border-b border-border py-2">
          <span className="block h-1 w-full bg-primary/60" />
          <span className="block h-1 w-4/5 bg-muted-foreground/35" />
        </div>
        <div className="grid grid-cols-[24px_1fr] gap-2 py-2">
          <span className="block h-1 w-full bg-primary/60" />
          <span className="block h-1 w-2/3 bg-muted-foreground/35" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-[2fr_1fr] gap-3 p-3" aria-hidden>
      <div className="flex flex-col justify-between border-r border-border pr-3">
        <span className="block h-5 w-full bg-foreground/65" />
        <span className="block h-8 w-full bg-primary/20" />
      </div>
      <div className="space-y-2 pt-1">
        <span className="block h-px w-full bg-foreground/50" />
        <span className="block h-1 w-full bg-muted-foreground/30" />
        <span className="block h-1 w-3/4 bg-muted-foreground/30" />
        <span className="mt-4 block h-px w-full bg-border" />
      </div>
    </div>
  );
}

export function TemplateSelector({
  currentTemplate,
  onTemplateChange,
}: TemplateSelectorProps) {
  const [pendingId, setPendingId] = useState<TemplateId | null>(null);
  const updateTemplate = useMutation(api.profiles.updateTemplate);
  const selectedTemplate = resolveTemplateId(currentTemplate);

  const handleSelect = async (templateId: TemplateId) => {
    if (pendingId !== null || selectedTemplate === templateId) return;
    setPendingId(templateId);
    try {
      await updateTemplate({ templateId });
      onTemplateChange?.(templateId);
      toast.success('Template updated');
    } catch {
      toast.error('Failed to update template');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Choose a Template</h3>
        <p className="text-sm text-muted-foreground">
          Select how your profile will be displayed
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">Profile template</legend>
        <div className="border-t">
          {TEMPLATES.map((template) => {
            const isActive = selectedTemplate === template.id;
            const isPending = pendingId === template.id;

            return (
              <label
                key={template.id}
                className="block border-b"
              >
                <input
                  type="radio"
                  name="profile-template"
                  value={template.id}
                  checked={isActive}
                  aria-busy={isPending}
                  disabled={pendingId !== null}
                  className="peer sr-only"
                  onChange={(event) => {
                    if (event.target.checked) void handleSelect(template.id);
                  }}
                />

                <div
                  className={`grid min-h-44 gap-5 bg-card p-4 text-left transition-colors duration-200 hover:bg-accent/40 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring sm:grid-cols-[12rem_1fr_auto] sm:items-center ${
                    pendingId !== null ? 'cursor-wait opacity-70' : ''
                  } ${isActive ? 'border-primary ring-1 ring-primary' : ''}`}
                >
                  <div className="h-28 overflow-hidden rounded-[2px] border bg-background">
                    <TemplatePreview templateId={template.id} />
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="flex h-5 w-5 items-center justify-center border border-primary bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 sm:hidden">
                    <p className="text-xs font-medium text-muted-foreground">
                      Best for:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.bestFor.slice(0, 2).map((use) => (
                        <span
                          key={use}
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          {use}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span
                    className={`flex h-11 w-full items-center justify-center rounded-[2px] border px-3 text-sm font-medium sm:w-28 ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background'
                    }`}
                  >
                    {isPending
                      ? 'Updating...'
                      : isActive
                        ? 'Active'
                        : 'Use Template'}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
