'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import type { UseFormReturn } from 'react-hook-form';
import type { ProfileUpdateFormValues } from '@/lib/types';

export function SectionSkills({
  form,
  skills,
  newSkill,
  onChangeNew,
  onAdd,
  onRemove,
  error,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  skills: string[];
  newSkill: string;
  onChangeNew: (v: string) => void;
  onAdd: () => void;
  onRemove: (skill: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Skills</h3>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newSkill}
            onChange={(event) => onChangeNew(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onAdd();
              }
            }}
            placeholder="Add a skill..."
          />
          <Button type="button" onClick={onAdd}>
            Add
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="px-3 py-1">
              <span>{skill}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2 text-muted-foreground hover:text-red-500"
                onClick={() => onRemove(skill)}
              >
                ×
              </Button>
            </Badge>
          ))}
        </div>
      </div>
      {/* Tie into form validation errors to preserve layout */}
      <FormField
        control={form.control}
        name="skills"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
