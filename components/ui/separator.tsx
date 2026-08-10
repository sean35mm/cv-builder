import * as React from 'react';

export type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
};

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { className = '', orientation = 'horizontal', decorative = true, ...props },
    ref
  ) => {
    const base = 'shrink-0 bg-border';
    const size = orientation === 'horizontal' ? 'h-px w-full' : 'h-24 w-px';
    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={orientation}
        className={`${base} ${size} ${className}`}
        {...props}
      />
    );
  }
);
Separator.displayName = 'Separator';

export { Separator };
