import type { ReactNode } from 'react';

export function PageHeading({
  index,
  title,
  description,
  actions,
}: {
  index: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-10 border-b pb-8 md:mb-14">
      <div className="platform-grid items-end gap-y-6">
        <div className="col-span-12 md:col-span-8">
          <p className="platform-kicker text-muted-foreground">{index}</p>
          <h1 className="mt-4 font-serif text-4xl font-normal tracking-[-0.03em] md:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
        {actions && (
          <div className="col-span-12 flex flex-wrap gap-2 md:col-span-4 md:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
