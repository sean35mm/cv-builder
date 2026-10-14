'use client';

import { Monitor, Smartphone } from 'lucide-react';
import {
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useWatch } from 'react-hook-form';

import type { ProfileForm } from '@/components/editor/fields';
import { ProfileDocument } from '@/components/profile/profile-document';
import { Button } from '@/components/ui/button';
import { stripBlankEntries } from '@/components/workspace/draft';
import {
  toPreviewProfile,
  type PersistedProfileInput,
  type ProfileUpdateFormValues,
} from '@/lib/profile/editor';
import { cn } from '@/lib/utils';

// Templates lay out against their container, so the preview renders at a
// real device width and is zoomed down to fit the pane.
const DEVICE_WIDTHS = { desktop: 800, mobile: 390 } as const;

type PreviewDevice = keyof typeof DEVICE_WIDTHS;

function PreviewFrame({
  device,
  children,
}: {
  device: PreviewDevice;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailable({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const width = DEVICE_WIDTHS[device];
  const zoom = available.width > 0 ? Math.min(1, available.width / width) : 1;

  return (
    <div ref={ref} className="scroll-quiet min-h-0 flex-1 overflow-y-auto p-4">
      <div
        className={cn(
          'mx-auto w-fit overflow-hidden border border-border bg-surface',
          device === 'mobile' ? 'rounded-xl' : 'rounded-lg',
          available.width === 0 && 'invisible'
        )}
      >
        {/* At least as tall as the pane, so a short profile doesn't end in
            a gap. The border's 2px is subtracted before un-zooming. */}
        <div
          className="@container flex flex-col"
          style={{
            width,
            zoom,
            minHeight: Math.max(0, available.height - 2) / zoom,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function PreviewPane({
  form,
  owner,
  templateId,
  colorTheme,
  className,
  headerClassName,
  footer,
}: {
  form: ProfileForm;
  owner: PersistedProfileInput;
  templateId: unknown;
  colorTheme: unknown;
  className?: string;
  headerClassName?: string;
  footer?: ReactNode;
}) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const watched = useWatch({
    control: form.control,
  }) as ProfileUpdateFormValues;
  const values = useDeferredValue(watched);
  const profile = useMemo(
    () => toPreviewProfile(owner, stripBlankEntries(values).values),
    [owner, values]
  );

  return (
    <div className={cn('flex min-h-0 w-full flex-col', className)}>
      <div
        className={cn(
          'flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border px-3',
          headerClassName
        )}
      >
        <span className="text-[12px] font-medium text-muted-foreground">
          Preview
        </span>
        <div role="group" aria-label="Preview size" className="flex gap-0.5">
          {(
            [
              ['desktop', 'Desktop', Monitor],
              ['mobile', 'Mobile', Smartphone],
            ] as const
          ).map(([value, label, Icon]) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              aria-pressed={device === value}
              onClick={() => setDevice(value)}
              className="aria-pressed:bg-secondary aria-pressed:text-foreground"
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </Button>
          ))}
        </div>
      </div>
      <PreviewFrame device={device}>
        <ProfileDocument
          profile={profile}
          templateId={templateId}
          colorTheme={colorTheme}
          className="flex-1"
        />
      </PreviewFrame>
      {footer}
    </div>
  );
}
