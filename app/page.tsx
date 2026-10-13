import type { Metadata } from 'next';
import { Footer } from '@/components/landing/footer';
import { LandingHeader } from '@/components/landing/landing-header';
import { Specimen } from '@/components/landing/specimen';
import { UsernameClaim } from '@/components/landing/username-claim';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const STEPS = [
  ['Claim', 'Pick a username. It becomes your address: opencv.app/u/you.'],
  [
    'Write',
    'Add your experience, projects and education in a plain editor, one section at a time.',
  ],
  [
    'Publish',
    'Choose a template and palette, then make it public, unlisted, or passcode-only.',
  ],
] as const;

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only rounded-md bg-surface px-3 py-2 text-[13px] shadow-popover focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50"
      >
        Skip to content
      </a>
      <LandingHeader />

      <main id="main" className="flex-1">
        <section
          aria-labelledby="hero-title"
          className="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-28"
        >
          <h1
            id="hero-title"
            className="font-serif text-[clamp(2.75rem,8.5vw,5.75rem)] font-normal leading-[0.95] tracking-[-0.035em] text-balance"
          >
            Your work, at one address.
          </h1>
          <p className="mt-6 max-w-[34rem] text-base leading-7 text-muted-foreground sm:text-[17px]">
            Write your CV once, choose how it looks, and share one link that
            stays current.
          </p>
          <div className="mt-10">
            <UsernameClaim />
          </div>
        </section>

        <section
          aria-label="Example profile"
          className="mx-auto max-w-6xl px-5 sm:px-8"
        >
          <Specimen />
        </section>

        <section
          aria-labelledby="how-title"
          className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
        >
          <h2
            id="how-title"
            className="text-[13px] font-medium text-muted-foreground"
          >
            How it works
          </h2>
          <ol className="mt-6 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map(([title, body], index) => (
              <li key={title} className="border-t border-border pt-5">
                <span className="font-mono text-[12px] text-subtle">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-[15px] font-medium">{title}</h3>
                <p className="mt-1.5 max-w-[32ch] text-[14px] leading-6 text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
}
