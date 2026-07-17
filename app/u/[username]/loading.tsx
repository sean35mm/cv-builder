export default function LoadingPublicProfile() {
  return (
    <main
      className="min-h-screen bg-background text-foreground"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="w-full max-w-3xl mx-auto py-12 px-6">
        <p className="sr-only">Loading profile</p>
        <div className="mb-10 flex items-center justify-between border-b pb-4">
          <div className="h-3 w-24 bg-muted" />
          <div className="h-3 w-20 bg-muted" />
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-12 w-2/3 bg-muted" />
            <div className="h-5 w-1/2 bg-muted" />
            <div className="h-4 w-1/3 bg-muted" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-muted" />
              <div className="h-4 w-5/6 bg-muted" />
            </div>
          </div>

          {[0, 1, 2].map((item) => (
            <section key={item} className="space-y-4 border-t pt-6">
              <div className="h-5 w-36 bg-muted" />
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-muted" />
                <div className="h-4 w-1/2 bg-muted" />
                <div className="h-3 w-full bg-muted" />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
