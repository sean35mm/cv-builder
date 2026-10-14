import type { Metadata } from 'next';
import { TestimonialForm } from './testimonial-form';

// Request links carry a secret token, so keep them out of search results
// and out of Referer headers.
export const metadata: Metadata = {
  title: 'Write a testimonial',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function RecommendPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <TestimonialForm token={token} />;
}
