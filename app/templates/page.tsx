'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { TemplateSelector } from '@/components/templates/template-selector';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TemplateId } from '@/lib/templates';

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
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/editor')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold font-serif">Templates</h1>
            <p className="text-sm text-muted-foreground">
              Choose how your profile looks
            </p>
          </div>
        </div>

        <TemplateSelector
          currentTemplate={profile.templateId as TemplateId | undefined}
        />
      </div>
    </div>
  );
}
