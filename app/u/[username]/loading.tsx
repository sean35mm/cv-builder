export default function LoadingPublicProfile() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-3xl mx-auto py-12 px-6">
        <div className="flex items-center justify-between mb-10">
          <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-12 w-2/3 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-1/2 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-1/3 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-5/6 rounded-full bg-muted animate-pulse" />
            </div>
          </div>

          {[0, 1, 2].map((item) => (
            <div key={item} className="space-y-4">
              <div className="h-5 w-36 rounded-full bg-muted animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-1/2 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
