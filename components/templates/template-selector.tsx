'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Check } from 'lucide-react';
import { resolveTemplateId, TEMPLATES, type TemplateId } from '@/lib/templates';
import { toast } from 'sonner';
import { useState } from 'react';

type TemplateSelectorProps = {
  currentTemplate?: unknown;
  onTemplateChange?: (templateId: TemplateId) => void;
  onPreview?: (templateId: TemplateId | null) => void;
  showHeading?: boolean;
};

export function TemplateSelector({
  currentTemplate,
  onTemplateChange,
  onPreview,
  showHeading = true,
}: TemplateSelectorProps) {
  const [pendingId, setPendingId] = useState<TemplateId | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>(
    'idle'
  );
  const updateTemplate = useMutation(api.profiles.updateTemplate);
  const selectedTemplate = resolveTemplateId(currentTemplate);

  const handleSelect = async (templateId: TemplateId) => {
    if (pendingId !== null || selectedTemplate === templateId) return;
    setPendingId(templateId);
    setSaveStatus('idle');
    try {
      await updateTemplate({ templateId });
      onTemplateChange?.(templateId);
      setSaveStatus('saved');
      toast.success('Template updated');
    } catch {
      setSaveStatus('error');
      toast.error('Failed to update template');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex min-h-6 flex-wrap items-end justify-between gap-2">
        {showHeading && (
          <div>
            <h3 className="text-lg font-semibold">Choose a template</h3>
            <p className="text-sm text-muted-foreground">
              Select the layout for your profile.
            </p>
          </div>
        )}
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {pendingId
            ? 'Saving template...'
            : saveStatus === 'saved'
              ? 'Template saved'
              : saveStatus === 'error'
                ? 'Template was not saved'
                : 'Saved when selected'}
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">Profile template</legend>
        <div className="space-y-3">
          {TEMPLATES.map((template) => {
            const isActive = selectedTemplate === template.id;
            const isPending = pendingId === template.id;

            return (
              <label
                key={template.id}
                className="block"
                onMouseEnter={() => onPreview?.(template.id)}
                onMouseLeave={() => onPreview?.(null)}
                onFocus={() => onPreview?.(template.id)}
                onBlur={() => onPreview?.(null)}
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
                  className={`flex min-h-20 items-center gap-4 rounded border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                    pendingId !== null ? 'cursor-wait opacity-70' : ''
                  } ${isActive ? 'border-foreground ring-1 ring-foreground' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  {isActive && (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <Check aria-hidden="true" className="size-3.5" />
                      <span className="sr-only">Selected</span>
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
