'use client';

export default function DirectoryError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 sm:px-6 lg:px-8">
      <div role="alert" className="rounded-lg border border-destructive/50 p-6">
        <h1 className="font-medium">The directory could not be loaded</h1>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
