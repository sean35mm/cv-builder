'use client';

import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
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
    setOpen(next);
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
      toast.error(message);
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
    toast.success('Import applied to your unsaved profile');
    setOpen(false);
    clear();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FileUp className="mr-1 h-3.5 w-3.5" />
          Import LinkedIn export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import a LinkedIn data export</DialogTitle>
        </DialogHeader>
        {!result ? (
          <div className="space-y-5">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Choose a LinkedIn ZIP or an individual Positions, Education,
                Skills, Certifications, Projects, Languages, or Publications
                CSV.
              </p>
              <p>
                Parsing happens only in this browser. The file is not uploaded,
                stored, logged, or sent to analytics. Contact and private
                account data are not imported.
              </p>
              <p>
                Processing is asynchronous and bounded, but a large valid
                archive may briefly affect browser responsiveness.
              </p>
            </div>
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
              className="block w-full text-sm"
            />
            {parsing && (
              <p role="status" className="text-sm text-muted-foreground">
                Reviewing the export locally…
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div aria-live="polite" className="text-sm">
              Found {linkedInImportCount(result.data)} supported item(s) in{' '}
              {result.parsedFiles.length} file(s). Select what to append.
              Existing entries are kept and duplicates are skipped.
            </div>
            <fieldset className="space-y-3">
              <legend className="font-medium">Sections to apply</legend>
              {LINKEDIN_IMPORT_SECTIONS.map((section) => {
                const count = result.data[section].length;
                return (
                  <label
                    key={section}
                    className="flex items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(section)}
                      disabled={count === 0}
                      onChange={(event) => {
                        setSelected((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(section);
                          else next.delete(section);
                          return next;
                        });
                      }}
                    />
                    <span className="flex-1">{labels[section]}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </label>
                );
              })}
            </fieldset>
            {result.warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">Warnings</h4>
                <ul className="mt-2 max-h-36 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-muted-foreground">
                  {result.warnings.map((warning, index) => (
                    <li key={`${warning}:${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Apply changes to the form, review them in each section, then use
              the normal Save button to persist. Closing this dialog discards
              parser rows and file bytes.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={clear}>
                Choose another file
              </Button>
              <Button
                type="button"
                onClick={apply}
                disabled={selected.size === 0}
              >
                Apply selected sections
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
