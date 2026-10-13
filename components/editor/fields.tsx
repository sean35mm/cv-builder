'use client';

import { ChevronDown, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { FieldPath, UseFormReturn } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { fieldClassName, Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';
import { cn } from '@/lib/utils';

export type ProfileForm = UseFormReturn<ProfileUpdateFormValues>;
export type FieldName = FieldPath<ProfileUpdateFormValues>;

type BaseFieldProps = {
  form: ProfileForm;
  name: FieldName;
  label: string;
  className?: string;
};

const itemClassName = 'gap-1.5';
const messageClassName = 'text-[12px] leading-4';

function FieldHeader({ label, meta }: { label: string; meta?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <FormLabel>{label}</FormLabel>
      {meta}
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span
      className={cn(
        'font-mono text-[11px] tabular-nums text-subtle',
        value > max && 'text-destructive'
      )}
    >
      {value}/{max}
    </span>
  );
}

export function TextField({
  form,
  name,
  label,
  className,
  maxLength,
  multiline = false,
  counter = false,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  disabled,
}: BaseFieldProps & {
  maxLength?: number;
  multiline?: boolean;
  counter?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'url' | 'month';
  inputMode?: 'numeric' | 'url' | 'email';
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string | undefined) ?? '';
        const shared = {
          name: field.name,
          ref: field.ref,
          value,
          onChange: field.onChange,
          onBlur: field.onBlur,
          maxLength,
          placeholder,
          disabled,
        };
        return (
          <FormItem className={cn(itemClassName, className)}>
            <FieldHeader
              label={label}
              meta={
                counter && maxLength ? (
                  <Counter value={value.length} max={maxLength} />
                ) : undefined
              }
            />
            <FormControl>
              {multiline ? (
                <Textarea rows={3} {...shared} />
              ) : (
                <Input
                  type={type}
                  inputMode={inputMode}
                  autoComplete={autoComplete ?? 'off'}
                  {...shared}
                />
              )}
            </FormControl>
            <FormMessage className={messageClassName} />
          </FormItem>
        );
      }}
    />
  );
}

// Native month picker where supported; elsewhere it degrades to a text box
// that expects YYYY-MM, which the schema validates.
export function MonthField(props: BaseFieldProps & { disabled?: boolean }) {
  return (
    <TextField {...props} type="month" placeholder="YYYY-MM" maxLength={50} />
  );
}

export function YearField(props: BaseFieldProps) {
  return (
    <TextField
      {...props}
      inputMode="numeric"
      placeholder="YYYY"
      maxLength={4}
    />
  );
}

export function CheckboxField({
  form,
  name,
  label,
  className,
  onCheckedChange,
}: BaseFieldProps & { onCheckedChange?: (checked: boolean) => void }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center gap-2', className)}>
          <FormControl>
            <Checkbox
              ref={field.ref}
              checked={Boolean(field.value)}
              onBlur={field.onBlur}
              onCheckedChange={(checked) => {
                field.onChange(checked === true);
                onCheckedChange?.(checked === true);
              }}
            />
          </FormControl>
          <FormLabel className="text-[13px] font-normal text-foreground">
            {label}
          </FormLabel>
        </FormItem>
      )}
    />
  );
}

export function SelectField({
  form,
  name,
  label,
  className,
  options,
  emptyLabel,
}: BaseFieldProps & {
  options: ReadonlyArray<{ value: string; label: string }>;
  emptyLabel: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(itemClassName, className)}>
          <FieldHeader label={label} />
          <div className="relative">
            <FormControl>
              <select
                ref={field.ref}
                name={field.name}
                value={(field.value as string | undefined) ?? ''}
                onBlur={field.onBlur}
                // An empty choice is stored as "not set", never as ''.
                onChange={(event) =>
                  field.onChange(event.target.value || undefined)
                }
                className={cn(
                  fieldClassName,
                  'h-8 appearance-none pr-8 pointer-coarse:h-11'
                )}
              >
                <option value="">{emptyLabel}</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormControl>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-subtle"
            />
          </div>
          <FormMessage className={messageClassName} />
        </FormItem>
      )}
    />
  );
}

// A list of short strings edited as chips. Enter or comma adds, Backspace on
// an empty input removes the last chip, and leaving the field keeps the text.
export function TagField({
  form,
  name,
  label,
  className,
  placeholder,
  maxItems,
  maxLength,
}: BaseFieldProps & {
  placeholder: string;
  maxItems: number;
  maxLength: number;
}) {
  const [draft, setDraft] = useState('');

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const values = (field.value as string[] | undefined) ?? [];
        const full = values.length >= maxItems;
        const commit = () => {
          const next = draft.trim();
          setDraft('');
          if (!next || full) return;
          const exists = values.some(
            (value) => value.toLocaleLowerCase() === next.toLocaleLowerCase()
          );
          if (!exists) field.onChange([...values, next]);
        };
        const remove = (index: number) =>
          field.onChange(values.filter((_, i) => i !== index));

        return (
          <FormItem className={cn(itemClassName, className)}>
            <FieldHeader
              label={label}
              meta={<Counter value={values.length} max={maxItems} />}
            />
            <div
              className={cn(
                fieldClassName,
                'flex min-h-8 flex-wrap items-center gap-1 px-1.5 py-1 has-[[aria-invalid=true]]:border-destructive focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/15 pointer-coarse:min-h-11'
              )}
            >
              {values.map((value, index) => (
                <span
                  key={`${value}:${index}`}
                  className="inline-flex h-6 max-w-full items-center gap-0.5 rounded border border-border bg-secondary pr-0.5 pl-2 text-[12.5px] text-foreground"
                >
                  <span className="truncate">{value}</span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove ${value}`}
                    className="flex size-5 shrink-0 items-center justify-center rounded-sm text-subtle transition-colors duration-150 hover:bg-border hover:text-foreground"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <FormControl>
                <input
                  ref={field.ref}
                  name={field.name}
                  value={draft}
                  maxLength={maxLength}
                  disabled={full}
                  placeholder={full ? 'Limit reached' : placeholder}
                  autoComplete="off"
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => {
                    commit();
                    field.onBlur();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                      event.preventDefault();
                      commit();
                    } else if (
                      event.key === 'Backspace' &&
                      draft === '' &&
                      values.length > 0
                    ) {
                      remove(values.length - 1);
                    }
                  }}
                  className="h-6 min-w-24 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-subtle focus-visible:outline-none disabled:cursor-not-allowed sm:text-[13px]"
                />
              </FormControl>
            </div>
            <FormMessage className={messageClassName} />
          </FormItem>
        );
      }}
    />
  );
}

// Image updates resolve their entry by ID when applied, so an upload that
// finishes after entries were reordered or removed can't land on the
// wrong one.
export function updateEntryImages(
  form: ProfileForm,
  section: 'projects' | 'exhibitions' | 'awards',
  entryId: string,
  update: (current: string[]) => string[]
) {
  const index = form
    .getValues(section)
    .findIndex((entry) => entry.id === entryId);
  if (index === -1) return;
  const current = form.getValues(`${section}.${index}.images`) ?? [];
  form.setValue(`${section}.${index}.images`, update(current), {
    shouldDirty: true,
  });
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2">{children}</div>;
}
