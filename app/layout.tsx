import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Instrument_Serif } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { ConvexClientProvider } from './ConvexClientProvider';
import { AppShell } from '@/components/app-shell';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import { getSiteOrigin } from '@/lib/custom-domains/server-config';

function getMetadataBase(): URL {
  return new URL(getSiteOrigin());
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'OpenCV — The Working Folio',
  description:
    'Publish a clear, shareable record of your work, experience, and projects.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f4ec' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0c0b' },
  ],
};

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif-instrument',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        suppressHydrationWarning
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`}
      >
        <body className="min-h-screen bg-background text-foreground font-sans">
          <ThemeProvider>
            <ConvexClientProvider>
              <AppShell>{children}</AppShell>
              <Toaster theme="system" />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
