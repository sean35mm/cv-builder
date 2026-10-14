import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Newsreader } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { ConvexClientProvider } from './ConvexClientProvider';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import { getSiteOrigin } from '@/lib/custom-domains/server-config';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';

function getMetadataBase(): URL {
  return new URL(getSiteOrigin());
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: { default: SITE_TITLE, template: '%s · OpenCV' },
  description: SITE_DESCRIPTION,
  applicationName: 'OpenCV',
  openGraph: {
    type: 'website',
    siteName: 'OpenCV',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#161618' },
  ],
};

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-newsreader',
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
        className={`${GeistSans.variable} ${GeistMono.variable} ${newsreader.variable}`}
      >
        <body className="min-h-screen bg-background font-sans text-foreground">
          <ThemeProvider>
            <ConvexClientProvider>
              {children}
              <Toaster
                theme="system"
                position="bottom-center"
                toastOptions={{
                  className:
                    '!rounded-lg !border-border !bg-surface !text-foreground !shadow-popover !text-[13px]',
                }}
              />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
