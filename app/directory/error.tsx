'use client';

export default function DirectoryError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="platform-page flex min-h-screen items-center">
      <div role="alert" className="w-full border-y border-destructive/50 py-10">
        <p className="platform-kicker text-destructive">Directory / Error</p>
        <h1 className="mt-3 font-serif text-4xl">The directory could not be loaded</h1>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 rounded-[2px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
