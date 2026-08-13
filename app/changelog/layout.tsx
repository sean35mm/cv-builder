import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/changelog' },
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
