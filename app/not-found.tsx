import Link from 'next/link';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col px-5">
      <header className="flex h-14 items-center sm:px-3">
        <Brand />
      </header>
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center pb-24">
        <p className="font-mono text-[12px] text-subtle">404</p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-[-0.025em]">
          Nothing at this address.
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
          The link may be mistyped, or the profile may be private or no longer
          exist.
        </p>
        <Button asChild size="lg" className="mt-8 self-start">
          <Link href="/">Go to OpenCV</Link>
        </Button>
      </div>
    </main>
  );
}
