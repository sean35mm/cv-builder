'use client';

import { useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';

export function SectionInterests({
  form,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
}) {
  const interests =
    useWatch({ control: form.control, name: 'interests' }) ?? [];
  const [nextInterest, setNextInterest] = useState('');

  const setInterests = (next: string[]) =>
    form.setValue('interests', next, {
      shouldDirty: true,
      shouldValidate: true,
    });

  const add = () => {
    const interest = nextInterest.trim();
    if (!interest) return;
    if (
      interests.some(
        (candidate) =>
          candidate.toLocaleLowerCase() === interest.toLocaleLowerCase()
      )
    ) {
      toast.info('Interest already added');
      return;
    }
    setInterests([...interests, interest]);
    setNextInterest('');
  };

  return (
    <section className="space-y-5" aria-labelledby="interests-heading">
      <div>
        <h3 id="interests-heading" className="text-lg font-medium">
          Interests
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add interests in the order you want visitors to see them.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={nextInterest}
          onChange={(event) => setNextInterest(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder="Add an interest"
          aria-label="New interest"
        />
        <Button type="button" onClick={add}>
          Add
        </Button>
      </div>
      <ol className="space-y-2">
        {interests.map((interest, index) => (
          <li
            key={`${interest}:${index}`}
            className="flex flex-wrap items-center gap-2 rounded border border-border bg-card p-3"
          >
            <span className="min-w-0 flex-1 basis-[10rem] break-words">
              {interest}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={index === 0}
              onClick={() => {
                const next = [...interests];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                setInterests(next);
              }}
              aria-label={`Move ${interest} up`}
            >
              Up
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={index === interests.length - 1}
              onClick={() => {
                const next = [...interests];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                setInterests(next);
              }}
              aria-label={`Move ${interest} down`}
            >
              Down
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setInterests(
                  interests.filter((_, itemIndex) => itemIndex !== index)
                )
              }
              aria-label={`Remove ${interest}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ol>
    </section>
  );
}
