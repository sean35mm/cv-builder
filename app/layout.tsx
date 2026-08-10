import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Source_Serif_4 } from 'next/font/google';
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
  title: 'OpenCV — Build your professional profile',
  description:
    'Publish a clear, shareable record of your work, experience, and projects.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9FAFB' },
    { media: '(prefers-color-scheme: dark)', color: '#12151C' },
  ],
};

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-profile-serif',
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
        className={`${GeistSans.variable} ${GeistMono.variable} ${sourceSerif.variable}`}
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
