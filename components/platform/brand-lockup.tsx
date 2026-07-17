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
        'inline-flex min-h-11 items-center gap-3 focus-visible:outline-none',
        className
      )}
      aria-label="OpenCV home"
    >
      <span className="font-serif text-2xl leading-none tracking-[-0.04em]">
        OpenCV
      </span>
      {!compact && (
        <span className="border-l pl-3 font-mono text-[9px] uppercase leading-tight tracking-[0.16em] text-muted-foreground">
          The working
          <br />
          folio
        </span>
      )}
    </Link>
  );
}
