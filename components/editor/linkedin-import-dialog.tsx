'use client';

import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mergeLinkedInImport } from '@/lib/import/linkedin-merge';
import { readLinkedInImportFile } from '@/lib/import/linkedin-preflight';
import {
  linkedInImportCount,
  parseLinkedInExportBytes,
} from '@/lib/import/linkedin-parser';
import {
  LINKEDIN_IMPORT_SECTIONS,
  type LinkedInImportResult,
  type LinkedInImportSection,
} from '@/lib/import/linkedin-types';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';

const labels: Record<LinkedInImportSection, string> = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  projects: 'Projects',
  languages: 'Languages',
  publications: 'Publications',
};

type LinkedInImportReview = Pick<
  LinkedInImportResult,
  'data' | 'warnings' | 'parsedFiles'
>;

export function LinkedInImportDialog({
  form,
  open,
  onOpenChange,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkedInImportReview | null>(null);
  const [selected, setSelected] = useState<Set<LinkedInImportSection>>(
    new Set()
  );

  const clear = () => {
    setError(null);
    setResult(null);
    setSelected(new Set());
    setParsing(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) clear();
  };

  const parseFile = async (file: File) => {
    clear();
    try {
      setParsing(true);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const bytes = await readLinkedInImportFile(file);
      const parsed = await parseLinkedInExportBytes(file.name, bytes);
      setResult({
        data: parsed.data,
        warnings: parsed.warnings,
        parsedFiles: parsed.parsedFiles,
      });
      setSelected(
        new Set(
          LINKEDIN_IMPORT_SECTIONS.filter(
            (section) => parsed.data[section].length > 0
          )
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The LinkedIn export could not be read.';
      setError(message);
    } finally {
      setParsing(false);
    }
  };

  const apply = () => {
    if (!result) return;
    const merged = mergeLinkedInImport(form.getValues(), result.data, selected);
    for (const section of LINKEDIN_IMPORT_SECTIONS) {
      form.setValue(section, merged[section], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    toast.success('Imported. Review the new entries in each section.');
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Import from LinkedIn</DialogTitle>
          <DialogDescription>
            Choose the ZIP from LinkedIn&apos;s data export, or one of its CSV
            files. It&apos;s read in this browser and never uploaded.
          </DialogDescription>
        </DialogHeader>
        {!result ? (
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept=".zip,.csv,text/csv,application/zip"
              disabled={parsing}
              aria-label="LinkedIn export file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void parseFile(file);
              }}
              className="block w-full text-[13px] text-muted-foreground file:mr-3 file:h-8 file:rounded-md file:border file:border-border-strong file:bg-surface file:px-3 file:text-[13px] file:font-medium file:text-foreground hover:file:bg-secondary"
            />
            {parsing && (
              <p role="status" className="text-[12px] text-muted-foreground">
                Reading the export…
              </p>
            )}
            {error && (
              <p role="alert" className="text-[12px] text-destructive">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p aria-live="polite" className="text-[13px] text-muted-foreground">
              Found {linkedInImportCount(result.data)} items in{' '}
              {result.parsedFiles.length}{' '}
              {result.parsedFiles.length === 1 ? 'file' : 'files'}. New entries
              are added after your existing ones; duplicates are skipped.
            </p>
            <fieldset className="divide-y divide-border border-y border-border">
              <legend className="sr-only">Sections to import</legend>
              {LINKEDIN_IMPORT_SECTIONS.map((section) => {
                const count = result.data[section].length;
                return (
                  <label
                    key={section}
                    className="flex h-9 items-center gap-3 text-[13px] has-[:disabled]:text-subtle"
                  >
                    <Checkbox
                      checked={selected.has(section)}
                      disabled={count === 0}
                      onCheckedChange={(checked) => {
                        setSelected((current) => {
                          const next = new Set(current);
                          if (checked === true) next.add(section);
                          else next.delete(section);
                          return next;
                        });
                      }}
                    />
                    <span className="flex-1">{labels[section]}</span>
                    <span className="font-mono text-[12px] text-subtle tabular-nums">
                      {count}
                    </span>
                  </label>
                );
              })}
            </fieldset>
            {result.warnings.length > 0 && (
              <details className="text-[12px] text-muted-foreground">
                <summary className="cursor-pointer">
                  {result.warnings.length}{' '}
                  {result.warnings.length === 1 ? 'warning' : 'warnings'}
                </summary>
                <ul className="mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-4">
                  {result.warnings.map((warning, index) => (
                    <li key={`${warning}:${index}`}>{warning}</li>
                  ))}
                </ul>
              </details>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={clear}>
                Choose another file
              </Button>
              <Button
                type="button"
                onClick={apply}
                disabled={selected.size === 0}
              >
                Import
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
