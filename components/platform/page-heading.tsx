import type { ReactNode } from 'react';

export function PageHeading({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {kicker && (
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {kicker}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[0.9375rem]">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}
