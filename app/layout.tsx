import './globals.css';
import type { Metadata } from 'next';
import { ConvexClientProvider } from './ConvexClientProvider';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata: Metadata = {
  title: 'CV Builder',
  description: 'Create and share your professional CV',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className='min-h-screen bg-background text-foreground font-sans'>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
