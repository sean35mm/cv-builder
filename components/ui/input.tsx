import * as React from 'react';

import { cn } from '@/lib/utils';

export const fieldClassName =
  'w-full min-w-0 rounded-md border border-input bg-surface px-2.5 text-base text-foreground shadow-[0_1px_0_rgb(0_0_0/0.02)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/15 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClassName,
        'flex h-8 py-1 pointer-coarse:h-11 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-foreground',
        className
      )}
      {...props}
    />
  );
}

export { Input };
