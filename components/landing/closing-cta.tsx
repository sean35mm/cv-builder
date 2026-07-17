'use client';

export function ClosingCTA({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className="border-t bg-foreground text-background" aria-labelledby="closing-title">
      <div className="platform-page py-20 md:py-28">
        <div className="platform-grid items-end gap-y-10">
          <div className="col-span-12 lg:col-span-9">
            <p className="platform-kicker opacity-70">Next edition</p>
            <h2 id="closing-title" className="mt-6 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
              Give the work a place to live.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-3 lg:text-right">
            <button
              type="button"
              onClick={onSignIn}
              className="min-h-11 border border-background px-6 py-3 text-sm transition-colors duration-200 hover:bg-background hover:text-foreground"
            >
              Start your folio →
            </button>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">Free to publish · No card</p>
          </div>
        </div>
      </div>
    </section>
  );
}
