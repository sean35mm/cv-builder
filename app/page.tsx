import type { Metadata } from 'next';
import { LandingPageClient } from './landing-page-client';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Page() {
  return <LandingPageClient />;
}
