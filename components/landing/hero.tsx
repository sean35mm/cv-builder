'use client';

import { UsernameClaim } from './username-claim';

export function Hero({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className="platform-page pb-20 pt-36 md:pb-28 md:pt-44" aria-labelledby="cover-title">
      <div className="platform-grid gap-y-12">
        <div className="col-span-12 lg:col-span-8">
          <p className="platform-kicker text-primary">OpenCV / The working folio</p>
          <h1 id="cover-title" className="platform-title mt-6 max-w-5xl">
            Your work,
            <br />
            still in motion.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
            Publish a clear record of what you have done, what you know, and how
            to reach you. One profile, kept current.
          </p>
          <div className="mt-10 max-w-xl">
            <UsernameClaim onClaim={onSignIn} />
          </div>
        </div>

        <aside className="col-span-12 border-t pt-5 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-label="Profile preview">
          <div className="profile-theme theme-sage bg-card p-5 text-card-foreground">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Published profile / 01
            </p>
            <h2 className="mt-12 font-serif text-4xl tracking-[-0.03em]">Mara Okafor</h2>
            <p className="mt-2 text-sm text-muted-foreground">Product designer · London</p>
            <div className="mt-10 border-t pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Selected work</p>
              <div className="mt-4 grid grid-cols-[5rem_1fr] gap-4 border-b pb-4 text-sm">
                <span className="text-muted-foreground">2024—now</span>
                <span>Design systems, Fieldwork</span>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-4 border-b py-4 text-sm">
                <span className="text-muted-foreground">2021—24</span>
                <span>Product design, Common Thread</span>
              </div>
            </div>
            <p className="mt-8 font-mono text-[11px] text-primary">opencv.app/@mara</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
