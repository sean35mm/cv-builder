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

function getMetadataBase(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredUrl && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SITE_URL must be configured in production');
  }

  const url = new URL(configuredUrl ?? 'http://localhost:3000');
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_SITE_URL must use http or https');
  }
  return url;
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'OpenCV - Create Your Personal Website',
  description:
    'Build a beautiful, shareable online CV in minutes. Stand out to hiring managers with your personalized website.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
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
