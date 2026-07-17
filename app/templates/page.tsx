'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { TemplateSelector } from '@/components/templates/template-selector';
import { Loader2 } from 'lucide-react';
import { resolveTemplateId } from '@/lib/templates';
import { PageHeading } from '@/components/platform/page-heading';

export default function TemplatesPage() {
  const router = useRouter();
  const profile = useQuery(api.profiles.getMyProfile);

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    router.push('/');
    return null;
  }

  return (
    <main className="platform-page min-h-screen" data-route-landmark="template-settings">
      <PageHeading index="03 / Profile edition" title="Templates" description="Choose the reading structure for your public profile. Your content and access settings remain unchanged." />

        <TemplateSelector
          currentTemplate={resolveTemplateId(profile.templateId)}
        />
    </main>
  );
}
