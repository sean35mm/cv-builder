import { BrandLockup } from '@/components/platform/brand-lockup';

export default function DirectoryLoading() {
  return (
    <main
      className="mx-auto min-h-screen max-w-[88rem] px-4 py-6 sm:px-6 md:py-8 lg:px-10"
      aria-busy="true"
      aria-label="Loading directory"
    >
      <BrandLockup className="group-data-[workspace-chrome=true]/app-shell:hidden" />
      <div className="mt-16 border-b border-border pb-8">
        <div className="h-4 w-28 animate-pulse rounded bg-muted/70" />
        <div className="mt-6 h-12 w-[32rem] max-w-full animate-pulse rounded bg-muted/70" />
      </div>
      <div className="mt-10 h-20 animate-pulse border-y border-border bg-card" />
      <div className="mt-10 grid border-t border-border sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-80 animate-pulse border-b border-border bg-muted/40"
          />
        ))}
      </div>
    </main>
  );
}
