'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    setPendingId(templateId);
    try {
      await updateTemplate({ templateId });
      onTemplateChange?.(templateId);
      toast.success('Template updated');
    } catch (error) {
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

      <div className="grid gap-4 sm:grid-cols-3">
        {TEMPLATES.map((template) => {
          const isActive = currentTemplate === template.id;
          const isPending = pendingId === template.id;

          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                isActive ? 'border-primary ring-1 ring-primary' : ''
              }`}
              onClick={() => handleSelect(template.id)}
            >
              <CardContent className="p-4">
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

                <Button
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className="w-full mt-4"
                  disabled={isPending}
                >
                  {isPending
                    ? 'Updating...'
                    : isActive
                      ? 'Active'
                      : 'Use Template'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
