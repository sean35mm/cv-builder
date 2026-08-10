import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BrandLockup({
  href = '/',
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-11 items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      aria-label="OpenCV home"
    >
      <span
        className={cn(
          'size-2.5 shrink-0 bg-accent',
          compact ? 'size-2' : 'size-2.5'
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'font-display font-semibold tracking-[-0.02em]',
          compact ? 'text-lg' : 'text-xl'
        )}
      >
        OpenCV
      </span>
    </Link>
  );
}
