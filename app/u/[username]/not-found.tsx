import Link from 'next/link';

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16 text-foreground">
      <div className="w-full max-w-[22rem]">
        <p className="font-mono text-[12px] text-muted-foreground">404</p>
        <h1 className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">
          This profile isn’t available
        </h1>
        <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
          There’s no public profile at this address. It may have been renamed,
          made private, or never published.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-[13px] text-foreground underline decoration-border-strong underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
        >
          Go to OpenCV
        </Link>
      </div>
    </main>
  );
}
