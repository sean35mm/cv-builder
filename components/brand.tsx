import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn('size-4 shrink-0', className)}
    >
      <rect width="16" height="16" rx="4" fill="currentColor" />
      <path
        d="M4.5 5.5h7M4.5 8h4.5M4.5 10.5h6"
        stroke="var(--background)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({
  href = '/',
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-md text-[14px] font-semibold tracking-[-0.01em] text-foreground',
        className
      )}
    >
      <BrandMark />
      OpenCV
    </Link>
  );
}
