'use client';

import { Check } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import type { ProfileForm } from '@/components/editor/fields';
import type { ProfileAccessMode } from '@/lib/profile/access';
import type { SectionId } from '@/lib/profile/domain';
import { cn } from '@/lib/utils';

type Step = {
  label: string;
  done: boolean;
  onSelect: () => void;
};

// Fills the sidebar for new profiles and disappears once every step is done.
export function SetupChecklist({
  form,
  accessMode,
  onOpenSection,
  onPublish,
}: {
  form: ProfileForm;
  accessMode: ProfileAccessMode;
  onOpenSection: (section: SectionId, field?: string) => void;
  onPublish: () => void;
}) {
  const [avatar, bio, experience, email, website, linkedin, github, twitter] =
    useWatch({
      control: form.control,
      name: [
        'avatar',
        'bio',
        'experience',
        'email',
        'website',
        'linkedin',
        'github',
        'twitter',
      ],
    });

  const steps: Step[] = [
    {
      label: 'Add a photo',
      done: Boolean(avatar),
      onSelect: () => onOpenSection('header'),
    },
    {
      label: 'Write a short bio',
      done: Boolean(bio?.trim()),
      onSelect: () => onOpenSection('header', 'bio'),
    },
    {
      label: 'Add your experience',
      done: (experience?.length ?? 0) > 0,
      onSelect: () => onOpenSection('experience'),
    },
    {
      label: 'Add a way to reach you',
      done: [email, website, linkedin, github, twitter].some((value) =>
        value?.trim()
      ),
      onSelect: () => onOpenSection('header', 'email'),
    },
    {
      label: 'Share your profile',
      done: accessMode !== 'private',
      onSelect: onPublish,
    },
  ];
  const completed = steps.filter((step) => step.done).length;
  if (completed === steps.length) return null;

  return (
    <section
      aria-labelledby="setup-heading"
      className="mt-auto rounded-lg border border-border bg-surface p-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2
          id="setup-heading"
          className="text-[12.5px] font-medium text-foreground"
        >
          Finish your profile
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-subtle">
          {completed}/{steps.length}
        </span>
      </div>
      <div
        aria-hidden="true"
        className="mt-2 h-1 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-out"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>
      <ul className="mt-2 -mx-1.5">
        {steps.map((step) => (
          <li key={step.label}>
            <button
              type="button"
              onClick={step.onSelect}
              className={cn(
                'flex h-7 w-full items-center gap-2 rounded-md px-1.5 text-left text-[12.5px] transition-colors duration-150 ease-out hover:bg-secondary pointer-coarse:h-10',
                step.done
                  ? 'text-subtle line-through decoration-subtle/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-3.5 shrink-0 items-center justify-center rounded-full border',
                  step.done
                    ? 'border-success bg-success text-background'
                    : 'border-border-strong'
                )}
              >
                {step.done && <Check className="size-2.5" strokeWidth={3} />}
              </span>
              <span className="truncate">
                {step.label}
                {step.done && <span className="sr-only"> (done)</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
