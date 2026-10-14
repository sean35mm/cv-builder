import { BrandMark } from '@/components/brand';

const bar = 'animate-pulse rounded bg-secondary';

// Mirrors the workspace layout so nothing shifts when data arrives.
export function WorkspaceSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-background" aria-busy="true">
      <span className="sr-only" role="status">
        Loading your workspace
      </span>
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <span className="flex size-7 items-center justify-center text-foreground">
          <BrandMark />
        </span>
        <div className={`${bar} hidden h-3 w-40 md:block`} />
        <div className={`${bar} h-7 w-[118px] rounded-md md:ml-2`} />
        <div className="ml-auto flex items-center gap-2">
          <div className={`${bar} h-3 w-12 max-sm:hidden`} />
          <div className={`${bar} h-7 w-7 rounded-md sm:w-16`} />
          <div className={`${bar} size-7 rounded-full`} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-60 shrink-0 space-y-1 border-r border-border p-2 md:block">
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="flex h-8 items-center px-2">
              <div
                className={`${bar} h-2.5`}
                style={{ width: 56 + ((index * 23) % 48) }}
              />
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[600px] space-y-6 px-4 pt-4 sm:px-6 md:px-8 md:pt-10">
            <div className={`${bar} h-8 w-full rounded-md md:hidden`} />
            <div className={`${bar} h-3.5 w-24`} />
            <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <div className={`${bar} h-2.5 w-16`} />
                  <div className={`${bar} h-8 w-full rounded-md`} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className={`${bar} h-2.5 w-16`} />
              <div className={`${bar} h-20 w-full rounded-md`} />
            </div>
          </div>
        </div>
        <div className="hidden w-[440px] shrink-0 border-l border-border xl:block 2xl:w-[560px]">
          <div className="h-10 border-b border-border" />
          <div className="p-4">
            <div className="aspect-[3/4] w-full rounded-lg border border-border bg-surface" />
          </div>
        </div>
      </div>
    </div>
  );
}
