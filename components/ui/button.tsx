import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out enabled:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/88',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline:
          'border border-border-strong bg-surface text-foreground shadow-[0_1px_0_rgb(0_0_0/0.03)] hover:bg-secondary',
        secondary: 'bg-secondary text-foreground hover:bg-border',
        ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        link: 'h-auto px-0 text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground',
      },
      size: {
        default: 'h-8 px-3 text-[13px] pointer-coarse:h-11',
        sm: 'h-7 px-2.5 text-[12.5px] pointer-coarse:h-10',
        lg: 'h-10 px-4 text-sm',
        icon: 'size-8 pointer-coarse:size-11',
        'icon-sm': 'size-7 pointer-coarse:size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
