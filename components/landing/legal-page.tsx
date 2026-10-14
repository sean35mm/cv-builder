import type { ReactNode } from 'react';
import { Brand } from '@/components/brand';
import { Footer } from '@/components/landing/footer';
import { SiteAnalytics } from '@/components/site-analytics';

// Legal copy keeps plain elements; this wrapper styles them.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteAnalytics />
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center px-5 sm:px-8">
        <Brand />
      </header>
      <main className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-24 pt-12 sm:pt-20">
        <h1 className="font-serif text-4xl font-normal tracking-[-0.025em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-[13px] text-muted-foreground">{updated}</p>
        <article className="mt-12 border-t border-border pt-2 text-[15px] leading-7 text-muted-foreground [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-1.5 [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-foreground [&_li]:pl-1 [&_p+p]:mt-4 [&_p+ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul+p]:mt-4">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}
