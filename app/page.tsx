import type { Metadata } from 'next';
import { Footer } from '@/components/landing/footer';
import { HeroFan } from '@/components/landing/hero-fan';
import { LandingHeader } from '@/components/landing/landing-header';
import { Specimen } from '@/components/landing/specimen';
import { ClaimJump, UsernameClaim } from '@/components/landing/username-claim';
import { PALETTES } from '@/lib/palettes';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const USERNAMES = [
  'noor',
  'amara',
  'ken',
  'priya',
  'jules',
  'tomas',
  'lena',
  'wei',
  'sofia',
  'marcus',
  'ines',
  'dev',
];

const ACCESS_MODES = [
  ['Private', 'Only you'],
  ['Passcode', 'Link and passcode'],
  ['Unlisted', 'Anyone with the link'],
  ['Public', 'Anyone, and search engines'],
] as const;

// Each palette's accent in dark mode, from profile.css.
const DARK_ACCENTS: Record<string, string> = {
  slate: '#aebbd0',
  sand: '#dcab78',
  sage: '#93c49d',
  olive: '#cbc76f',
  ocean: '#82b2f1',
  rose: '#ee93a2',
};

const SAMPLE_VIEWS = [30, 45, 38, 62, 55, 84, 100];

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

const tileClass = 'rounded-2xl border border-border bg-surface p-6';
const tileTitleClass =
  'font-serif text-[26px] leading-[1.1] tracking-[-0.02em] text-foreground';
const tileBodyClass = 'mt-1.5 text-[14px] leading-6 text-muted-foreground';

export default function Page() {
  return (
    <div className="landing flex min-h-dvh flex-col bg-background">
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
          className="relative isolate overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-32 -z-10 size-[760px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,#a23a4c_16%,transparent),transparent)] dark:opacity-70"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[22%] top-[40%] -z-10 size-[460px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,#3d6a44_16%,transparent),transparent)] dark:opacity-70"
          />
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
            <div>
              <p className="flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[#8a5a2b] dark:text-[#dcab78]">
                <span aria-hidden="true" className="h-px w-7 bg-current" />A CV
                that lives at a link
              </p>
              <h1
                id="hero-title"
                className="mt-5 font-serif text-[clamp(3rem,8vw,5.75rem)] font-normal leading-[0.92] tracking-[-0.04em] text-balance"
              >
                Your work, at{' '}
                <em className="text-[#a23a4c] dark:text-[#ee93a2]">one</em>{' '}
                address.
              </h1>
              <p className="mt-6 max-w-[30rem] text-base leading-7 text-muted-foreground sm:text-[17px]">
                Write your CV once, choose how it looks, and share one link that
                stays current, for recruiters, clients, or anyone who asks.
              </p>
              <div className="mt-9">
                <UsernameClaim />
              </div>
            </div>
            <HeroFan />
          </div>
        </section>

        <div
          aria-hidden="true"
          className="overflow-hidden border-y border-border py-4 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
        >
          <div className="flex w-max animate-marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0">
                {USERNAMES.map((name) => (
                  <span
                    key={name}
                    className="px-6 font-serif text-[16px] text-muted-foreground"
                  >
                    <span className="font-mono text-[13px] text-subtle">
                      /u/
                    </span>
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section
          aria-labelledby="features-title"
          className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28"
        >
          <h2
            id="features-title"
            className="max-w-[20ch] font-serif text-[clamp(2rem,4.5vw,3.25rem)] leading-[1] tracking-[-0.03em] text-balance"
          >
            One link, and you decide the rest.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div className={`${tileClass} lg:row-span-2`}>
              <h3 className={tileTitleClass}>You decide who sees it.</h3>
              <p className={tileBodyClass}>
                Four access modes. Switch any time; the link never changes.
              </p>
              <ul className="mt-5 flex flex-col gap-2">
                {ACCESS_MODES.map(([mode, who]) => (
                  <li
                    key={mode}
                    className={
                      mode === 'Unlisted'
                        ? 'flex items-center justify-between gap-3 rounded-lg border border-foreground px-3 py-2.5 text-[13px] shadow-[0_0_0_3px_color-mix(in_srgb,var(--foreground)_8%,transparent)]'
                        : 'flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-[13px]'
                    }
                  >
                    <span>{mode}</span>
                    <span className="text-[12px] text-subtle">{who}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={tileClass}>
              <div className="flex items-start justify-between gap-3">
                <h3 className={tileTitleClass}>See who&apos;s looking.</h3>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-subtle">
                  Example
                </span>
              </div>
              <p className={tileBodyClass}>
                Views and referrers, only from visitors who agree.
              </p>
              <p className="mt-4 font-serif text-[54px] leading-none tracking-[-0.03em]">
                128
                <span className="ml-2 font-sans text-[13px] tracking-normal text-subtle">
                  views this week
                </span>
              </p>
              <div
                aria-hidden="true"
                className="mt-4 flex h-16 items-end gap-1.5"
              >
                {SAMPLE_VIEWS.map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t-[4px] rounded-b-[1px] bg-[#1c5dab] opacity-85 dark:bg-[#82b2f1]"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div
              className={`${tileClass} overflow-hidden bg-[color-mix(in_srgb,#8a5a2b_7%,var(--surface))]`}
            >
              <h3 className={tileTitleClass}>PDF in one click.</h3>
              <p className={tileBodyClass}>
                The same layout, ready to print, always the latest version.
              </p>
              <div
                aria-hidden="true"
                className="mt-5 -rotate-3 rounded-lg bg-white p-4 shadow-[0_12px_30px_-12px_rgb(80_50_20/0.4)]"
              >
                <p className="font-serif text-[18px] text-[#1b1a17]">
                  Noor Haddad
                </p>
                <p className="font-serif text-[12px] italic text-[#a23a4c]">
                  Staff software engineer
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-[#eeeae3]" />
                <div className="mt-2 h-1.5 w-3/4 rounded-full bg-[#eeeae3]" />
              </div>
            </div>

            <div
              className={`${tileClass} flex flex-col justify-between gap-5 sm:flex-row sm:items-center md:col-span-2`}
            >
              <div>
                <h3 className={tileTitleClass}>
                  Six palettes, light and dark.
                </h3>
                <p className={tileBodyClass}>
                  Every palette works with every template, in both modes.
                </p>
              </div>
              <ul aria-label="Palettes" className="flex shrink-0 gap-2.5">
                {PALETTES.map((palette) => (
                  <li
                    key={palette.id}
                    title={palette.name}
                    className="size-9 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
                    style={{
                      background: `linear-gradient(135deg, ${palette.swatch} 50%, ${DARK_ACCENTS[palette.id]} 50%)`,
                    }}
                  >
                    <span className="sr-only">{palette.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="specimen-title"
          className="mx-auto max-w-6xl px-5 pt-24 sm:px-8 sm:pt-32"
        >
          <h2
            id="specimen-title"
            className="font-serif text-[clamp(2rem,4.5vw,3.25rem)] leading-[1] tracking-[-0.03em]"
          >
            Try every template.
          </h2>
          <p className="mt-3 max-w-[34rem] text-[15px] leading-7 text-muted-foreground">
            This is a real profile. Switch the template and palette to see how
            yours could look.
          </p>
          <div className="mt-8">
            <Specimen />
          </div>
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
                <span className="font-serif text-[56px] leading-none tracking-[-0.04em] text-subtle">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-[16px] font-medium">{title}</h3>
                <p className="mt-1.5 max-w-[32ch] text-[14px] leading-6 text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="cta-title"
          className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28"
        >
          <div className="relative isolate flex flex-col items-start justify-between gap-8 overflow-hidden rounded-3xl bg-[#1d2633] p-8 text-[#f6f3ee] sm:p-14 md:flex-row md:items-end dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-32 -z-10 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(130_178_241/0.35),transparent)]"
            />
            <h2
              id="cta-title"
              className="max-w-[16ch] font-serif text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[0.95] tracking-[-0.035em] text-balance"
            >
              Claim <em className="text-[#ee93a2]">your</em> name before someone
              else does.
            </h2>
            <ClaimJump className="shrink-0 bg-[#f6f3ee] text-[#1d2633] hover:bg-white" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
