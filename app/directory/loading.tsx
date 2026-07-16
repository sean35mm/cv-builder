export default function DirectoryLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-6 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-9 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-8 h-20 animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-44 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </main>
  );
}
