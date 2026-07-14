'use client';

import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';

export function SectionSkills({
  form,
  newSkill,
  onChangeNewSkill,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  newSkill: string;
  onChangeNewSkill: (value: string) => void;
}) {
  const skills = useWatch({ control: form.control, name: 'skills' }) ?? [];
  const { errors } = useFormState({ control: form.control, name: 'skills' });

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const exists = skills.some(
      (skill) => skill.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.info('Skill already added');
      return;
    }
    form.setValue('skills', [...skills, trimmed], {
      shouldDirty: true,
      shouldValidate: true,
    });
    onChangeNewSkill('');
  };

  const removeSkill = (skill: string) => {
    form.setValue(
      'skills',
      skills.filter((value) => value !== skill),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Skills</h3>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newSkill}
            onChange={(event) => onChangeNewSkill(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addSkill();
              }
            }}
            placeholder="Add a skill..."
          />
          <Button type="button" onClick={addSkill}>
            Add
          </Button>
        </div>
        {errors.skills?.message && (
          <p className="text-destructive text-sm">{errors.skills.message}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="px-3 py-1">
              <span>{skill}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2 text-muted-foreground hover:text-red-500"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill} skill`}
                title={`Remove ${skill} skill`}
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
