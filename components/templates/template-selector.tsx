'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Check } from 'lucide-react';
import { TEMPLATES, type TemplateId } from '@/lib/templates';
import { toast } from 'sonner';
import { useState } from 'react';

type TemplateSelectorProps = {
  currentTemplate: TemplateId | undefined;
  onTemplateChange?: (templateId: TemplateId) => void;
};

export function TemplateSelector({
  currentTemplate,
  onTemplateChange,
}: TemplateSelectorProps) {
  const [pendingId, setPendingId] = useState<TemplateId | null>(null);
  const updateTemplate = useMutation(api.profiles.updateTemplate);

  const handleSelect = async (templateId: TemplateId) => {
    if (pendingId !== null || currentTemplate === templateId) return;
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

      <div
        className="grid gap-4 sm:grid-cols-3"
        role="radiogroup"
        aria-label="Profile template"
      >
        {TEMPLATES.map((template) => {
          const isActive = currentTemplate === template.id;
          const isPending = pendingId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-busy={isPending}
              disabled={pendingId !== null}
              className={`rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70 ${
                isActive ? 'border-primary ring-1 ring-primary' : ''
              }`}
              onClick={() => void handleSelect(template.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                {isActive && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-1">
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
                className={`mt-4 flex h-8 w-full items-center justify-center rounded-md border px-3 text-sm font-medium ${
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
