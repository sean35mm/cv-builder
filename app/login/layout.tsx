import type { Metadata } from 'next';
import { SiteAnalytics } from '@/components/site-analytics';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteAnalytics />
      {children}
    </>
  );
}
