export default function DirectoryLoading() {
  return (
    <main className="platform-page min-h-screen" aria-busy="true" aria-label="Loading directory">
      <div className="h-6 w-20 animate-pulse bg-muted" />
      <div className="mt-6 h-9 w-72 max-w-full animate-pulse bg-muted" />
      <div className="mt-8 h-20 animate-pulse border-y bg-muted" />
      <div className="mt-8 border-t">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse border-b bg-muted/60" />
        ))}
      </div>
    </main>
  );
}
