import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/roadmap' },
};

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
