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
import type {
  PersistedProfileInput,
  ProfileUpdateFormValues,
} from '@/lib/profile/editor';

// 'invalid' means some fields can't be saved yet; everything else has been.
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
// sends the latest form state, so rapid edits coalesce.
export function useAutosave({
  form,
  schema,
  getLive,
  save,
  onSaved,
}: {
  form: UseFormReturn<ProfileUpdateFormValues>;
  schema: z.ZodType<ProfileUpdateFormValues, ProfileUpdateFormValues>;
  // The profile as the server has it now; invalid parts fall back to it.
  getLive: () => PersistedProfileInput;
  save: (payload: ContentPayload) => Promise<unknown>;
  onSaved: (payload: ContentPayload) => void;
}) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [invalidCount, setInvalidCount] = useState(0);
  const [initialKey] = useState(() => {
    const draft = prepareDraft(form.getValues(), schema, getLive());
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

  // Resolves with the status once everything savable has been sent.
  const flush = useCallback(async (): Promise<SaveStatus> => {
    clearTimer(timer);
    while (inFlight.current) await inFlight.current;
    if (discarded.current) return statusRef.current;

    const draft = prepareDraft(form.getValues(), schema, getLive());
    setInvalidCount(draft.invalidCount);
    const settled = (): SaveStatus =>
      draft.invalidCount > 0
        ? 'invalid'
        : timer.current === null
          ? 'saved'
          : 'pending';

    if (!draft.ok || draft.key === lastSavedKey.current) {
      update(settled());
      return statusRef.current;
    }

    update('saving');
    const run = save(draft.payload).then(
      () => {
        lastSavedKey.current = draft.key;
        onSaved(draft.payload);
        update(settled());
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
    return statusRef.current;
  }, [form, schema, getLive, save, onSaved, update]);

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
      // Pending, failed, or partly invalid: try once more, and keep the
      // prompt for the case where the save can't land in time.
      void flush();
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

  // Run `task` with no save in flight before, during, or after it starts:
  // pending edits are flushed first, and timers that fire meanwhile wait.
  const exclusive = useCallback(
    async <T>(task: () => Promise<T>): Promise<T> => {
      await flush();
      while (inFlight.current) await inFlight.current;
      let release = () => {};
      const lock = new Promise<void>((resolve) => {
        release = resolve;
      });
      inFlight.current = lock;
      try {
        return await task();
      } finally {
        if (inFlight.current === lock) inFlight.current = null;
        release();
      }
    },
    [flush]
  );

  return { status, invalidCount, flush, discard, exclusive };
}
