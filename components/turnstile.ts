'use client';

import { useCallback, useRef } from 'react';

// Cloudflare Turnstile, loaded straight from Cloudflare with explicit render.
// Without NEXT_PUBLIC_TURNSTILE_SITE_KEY the widget is skipped entirely.
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// Long enough for a visitor to finish an interactive challenge.
const TOKEN_TIMEOUT_MS = 90_000;

type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  appearance: 'always' | 'execute' | 'interaction-only';
  'response-field': boolean;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions
  ) => string | null | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

export class TurnstileError extends Error {}

const turnstileApi = (): TurnstileApi | undefined =>
  (window as Window & { turnstile?: TurnstileApi }).turnstile;

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  const loaded = turnstileApi();
  if (loaded) return Promise.resolve(loaded);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.onload = () => {
      const api = turnstileApi();
      if (api) resolve(api);
      else reject(new TurnstileError('Turnstile did not initialize'));
    };
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new TurnstileError('Turnstile failed to load'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const safely = (run: () => void) => {
  try {
    run();
  } catch {
    // The widget may already be gone.
  }
};

type Waiter = {
  resolve: (token: string) => void;
  reject: (error: TurnstileError) => void;
};

/**
 * Renders an invisible-unless-needed Turnstile widget into the element `containerRef` is attached to and
 * hands out one token per `getToken()` call. Each token is used once: taking
 * it resets the widget so the next send gets a fresh one.
 */
export function useTurnstile(siteKey: string | undefined) {
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const waiter = useRef<Waiter | null>(null);
  const failure = useRef<TurnstileError | null>(null);

  const rejectWaiter = useCallback((error: TurnstileError) => {
    const pending = waiter.current;
    waiter.current = null;
    pending?.reject(error);
  }, []);

  const containerRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || !siteKey) return;
      let active = true;
      let id: string | null = null;
      failure.current = null;

      loadTurnstile()
        .then((api) => {
          if (!active) return;
          id =
            api.render(element, {
              sitekey: siteKey,
              action: 'otp-send',
              appearance: 'interaction-only',
              'response-field': false,
              callback: (issued) => {
                const pending = waiter.current;
                if (!pending) {
                  token.current = issued;
                  return;
                }
                waiter.current = null;
                pending.resolve(issued);
                window.setTimeout(() => {
                  if (id) safely(() => api.reset(id as string));
                }, 0);
              },
              'expired-callback': () => {
                token.current = null;
              },
              'error-callback': () => {
                token.current = null;
                rejectWaiter(new TurnstileError('Turnstile challenge failed'));
              },
            }) ?? null;
          widgetId.current = id;
        })
        .catch((error: unknown) => {
          if (!active) return;
          failure.current =
            error instanceof TurnstileError
              ? error
              : new TurnstileError('Turnstile failed to load');
          rejectWaiter(failure.current);
        });

      return () => {
        active = false;
        const api = turnstileApi();
        if (id && api) safely(() => api.remove(id as string));
        if (widgetId.current === id) widgetId.current = null;
        token.current = null;
      };
    },
    [siteKey, rejectWaiter]
  );

  const getToken = useCallback((): Promise<string> => {
    if (failure.current) return Promise.reject(failure.current);
    const ready = token.current;
    const id = widgetId.current;
    const api = turnstileApi();
    if (ready && id && api) {
      token.current = null;
      safely(() => api.reset(id));
      return Promise.resolve(ready);
    }
    rejectWaiter(new TurnstileError('Superseded by a newer request'));
    return new Promise<string>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (waiter.current !== entry) return;
        waiter.current = null;
        reject(new TurnstileError('Turnstile timed out'));
      }, TOKEN_TIMEOUT_MS);
      const entry: Waiter = {
        resolve: (issued) => {
          window.clearTimeout(timer);
          resolve(issued);
        },
        reject: (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      };
      waiter.current = entry;
    });
  }, [rejectWaiter]);

  return { enabled: Boolean(siteKey), containerRef, getToken };
}
