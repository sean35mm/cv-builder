'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

import { prepareDraft } from '@/components/workspace/draft';
import type { ProfileUpdateInput } from '@/lib/profile/domain';
import type { ProfileUpdateFormValues } from '@/lib/profile/editor';

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error' | 'invalid';

type ContentPayload = Omit<
  ProfileUpdateInput,
  'isPublic' | 'isDirectoryListed'
>;

const AUTOSAVE_DELAY_MS = 800;

const clearTimer = (timer: RefObject<number | null>) => {
  if (timer.current === null) return;
  window.clearTimeout(timer.current);
  timer.current = null;
};

// Debounced, serialized autosave: at most one save in flight, and every save
// sends the latest valid form state, so rapid edits coalesce.
export function useAutosave({
  form,
  schema,
  save,
  onSaved,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  schema: z.ZodType<ProfileUpdateFormValues, ProfileUpdateFormValues>;
  save: (payload: ContentPayload) => Promise<unknown>;
  onSaved: (payload: ContentPayload) => void;
}) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [invalidCount, setInvalidCount] = useState(0);
  const [initialKey] = useState(() => {
    const draft = prepareDraft(form.getValues(), schema);
    return draft.ok ? draft.key : '';
  });
  const lastSavedKey = useRef(initialKey);
  const timer = useRef<number | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const discarded = useRef(false);
  const statusRef = useRef<SaveStatus>('saved');

  const update = useCallback((next: SaveStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const flush = useCallback(async (): Promise<void> => {
    clearTimer(timer);
    while (inFlight.current) await inFlight.current;
    if (discarded.current) return;

    const draft = prepareDraft(form.getValues(), schema);
    if (!draft.ok) {
      setInvalidCount(draft.invalidCount);
      update('invalid');
      return;
    }
    if (draft.key === lastSavedKey.current) {
      update(timer.current === null ? 'saved' : 'pending');
      return;
    }

    update('saving');
    const run = save(draft.payload).then(
      () => {
        lastSavedKey.current = draft.key;
        onSaved(draft.payload);
        update(timer.current === null ? 'saved' : 'pending');
      },
      (error: unknown) => {
        console.error(error);
        update('error');
      }
    );
    const tracked = run.finally(() => {
      if (inFlight.current === tracked) inFlight.current = null;
    });
    inFlight.current = tracked;
    await tracked;
  }, [form, schema, save, onSaved, update]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (discarded.current) return;
      clearTimer(timer);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        void flush();
      }, AUTOSAVE_DELAY_MS);
      if (statusRef.current !== 'saving' && statusRef.current !== 'invalid') {
        update('pending');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, flush, update]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (discarded.current || statusRef.current === 'saved') return;
      // Starting the save may still land; the prompt covers the case it won't.
      if (timer.current !== null) void flush();
      event.preventDefault();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
      // Unmounting means client navigation: send whatever is pending.
      void flush();
    };
  }, [flush]);

  // Stop saving for good, e.g. while the account is being deleted.
  const discard = useCallback(() => {
    discarded.current = true;
    clearTimer(timer);
    update('saved');
  }, [update]);

  return { status, invalidCount, flush, discard };
}
