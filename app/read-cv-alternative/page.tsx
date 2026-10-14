import type { Metadata } from 'next';
import { Footer } from '@/components/landing/footer';
import { LandingHeader } from '@/components/landing/landing-header';
import { ClaimJump, UsernameClaim } from '@/components/landing/username-claim';
import { SiteAnalytics } from '@/components/site-analytics';
import { PALETTES } from '@/lib/palettes';
import { TEMPLATES } from '@/lib/templates';

export const metadata: Metadata = {
  title: 'A read.cv alternative',
  description:
    'Read.cv has shut down. OpenCV is a free, open source place for your CV: one link, three templates, and you choose who can see it.',
  alternates: { canonical: '/read-cv-alternative' },
};

const REPO_URL = 'https://github.com/sean35mm/cv-builder';
const SOURCE_URL =
  'https://techcrunch.com/2025/01/17/perplexity-acquires-read-cv-a-social-media-platform-for-professionals/';

const OFFERS = [
  [
    'Free and open source',
    'No paid plan. The code is MIT licensed and on GitHub, so you can read it or host your own copy.',
  ],
  [
    'One link',
    'Your profile lives at opencv.app/u/username. Update it and the same link shows the new version.',
  ],
  [
    `${TEMPLATES.length} templates`,
    `${TEMPLATES.map((template) => template.name).join(', ')}. Switch any time.`,
  ],
  [
    `${PALETTES.length} palettes, light and dark`,
    `${PALETTES.map((palette) => palette.name).join(', ')}. Each one works with every template.`,
  ],
  [
    'You choose who sees it',
    'Private, passcode, unlisted, or public. Change it whenever your audience changes.',
  ],
  [
    'PDF download',
    'The same profile as a PDF, for the places that still ask for one.',
  ],
  [
    'Views, with consent',
    'See how many people looked. Only visitors who agree are counted.',
  ],
  [
    'LinkedIn import',
    'Upload your LinkedIn data export and pick what to bring over. It is read in your browser.',
  ],
] as const;

const tileClass = 'rounded-2xl border border-border bg-surface p-6';
const tileTitleClass =
  'font-serif text-[22px] leading-[1.15] tracking-[-0.02em] text-foreground';
const tileBodyClass = 'mt-1.5 text-[14px] leading-6 text-muted-foreground';
const h2Class =
  'font-serif text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.02] tracking-[-0.03em] text-balance';
const linkClass = 'text-foreground underline underline-offset-4';

export default function ReadCvAlternativePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteAnalytics />
      <a
        href="#main"
        className="sr-only rounded-md bg-surface px-3 py-2 text-[13px] shadow-popover focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50"
      >
        Skip to content
      </a>
      <LandingHeader />

      <main id="main" className="flex-1">
        <section
          aria-labelledby="page-title"
          className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20"
        >
          <p className="flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.08em] text-[#8a5a2b] dark:text-[#dcab78]">
            <span aria-hidden="true" className="h-px w-7 bg-current" />
            For former read.cv users
          </p>
          <h1
            id="page-title"
            className="mt-5 max-w-[16ch] font-serif text-[clamp(2.75rem,7vw,5rem)] font-normal leading-[0.95] tracking-[-0.04em] text-balance"
          >
            A new home for your{' '}
            <em className="text-[#a23a4c] dark:text-[#ee93a2]">CV</em>.
          </h1>
          <p className="mt-6 max-w-[34rem] text-base leading-7 text-muted-foreground sm:text-[17px]">
            Read.cv is gone. OpenCV is a free, open source place to publish your
            CV at one link. Take the username you want before someone else does.
          </p>
          <div className="mt-9">
            <UsernameClaim />
          </div>
        </section>

        <section
          aria-labelledby="happened-title"
          className="mx-auto max-w-6xl border-t border-border px-5 py-16 sm:px-8 sm:py-24"
        >
          <h2 id="happened-title" className={h2Class}>
            What happened to read.cv
          </h2>
          <div className="mt-6 max-w-[40rem] space-y-4 text-[15px] leading-7 text-muted-foreground">
            <p>
              On January 17, 2025, Read.cv was{' '}
              <a
                href={SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                reported as acquired by Perplexity
              </a>
              . It began winding down that day, and users could export their
              data until May 16, 2025.
            </p>
            <p>
              If you built a profile there, you lost the page and the link you
              had shared. OpenCV can&apos;t bring those back. It can give you a
              new one that you keep.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="offers-title"
          className="mx-auto max-w-6xl border-t border-border px-5 py-16 sm:px-8 sm:py-24"
        >
          <h2 id="offers-title" className={h2Class}>
            What OpenCV gives you
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERS.map(([title, body]) => (
              <li key={title} className={tileClass}>
                <h3 className={tileTitleClass}>{title}</h3>
                <p className={tileBodyClass}>{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="honest-title"
          className="mx-auto max-w-6xl border-t border-border px-5 py-16 sm:px-8 sm:py-24"
        >
          <h2 id="honest-title" className={h2Class}>
            What it is not
          </h2>
          <ul className="mt-6 max-w-[40rem] list-disc space-y-3 pl-5 text-[15px] leading-7 text-muted-foreground">
            <li>
              It is a profile page, not a social network. There is no feed and
              nobody to follow.
            </li>
            <li>
              There is no read.cv importer. You will need to re-enter your work,
              or import it from LinkedIn.
            </li>
            <li>
              It is a young project run by one person. The{' '}
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                source is on GitHub
              </a>
              , so you can read it, fork it, or host it yourself.
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="cta-title"
          className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28"
        >
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl bg-[#1d2633] p-8 text-[#f6f3ee] sm:p-14 md:flex-row md:items-end dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]">
            <div>
              <h2
                id="cta-title"
                className="max-w-[16ch] font-serif text-[clamp(2rem,5vw,3.25rem)] leading-[0.98] tracking-[-0.035em] text-balance"
              >
                Claim <em className="text-[#ee93a2]">your</em> username.
              </h2>
              <p className="mt-4 max-w-[30rem] text-[15px] leading-7 text-[#f6f3ee]/70">
                Sign in with an email code. You can keep the profile private
                until it is ready.
              </p>
            </div>
            <ClaimJump className="shrink-0 bg-[#f6f3ee] text-[#1d2633] hover:bg-white" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
