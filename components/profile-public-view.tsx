import type { ProfileContent } from '@/lib/types';
import type { Id } from '@/convex/_generated/dataModel';
import { ContactDialog } from '@/components/contact/contact-dialog';
import { ClassicView } from '@/components/templates/classic-view';
import { ModernView } from '@/components/templates/modern-view';
import { MinimalView } from '@/components/templates/minimal-view';
import { CreativeView } from '@/components/templates/creative-view';
import { DeveloperView } from '@/components/templates/developer-view';
import { getTemplate, resolveTemplateId } from '@/lib/templates';
import type { ProfileFontId } from '@/lib/profile/typography';
import { ProfileTypography } from '@/components/profile/profile-typography';
import Link from 'next/link';

type Testimonial = {
  _id: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  relationship: string;
  content: string;
  rating?: number;
  createdAt: number;
};

export function ProfilePublicView({
  profile,
  pdfUrl,
  sectionsVisibility,
  profileId,
  templateId,
  testimonials,
  headingFont,
  bodyFont,
}: {
  profile: ProfileContent;
  pdfUrl?: string;
  sectionsVisibility?: Record<string, boolean>;
  profileId: Id<'profiles'>;
  templateId?: unknown;
  testimonials?: Testimonial[];
  headingFont?: ProfileFontId;
  bodyFont?: ProfileFontId;
}) {
  const resolvedTemplateId = resolveTemplateId(templateId);
  const template = getTemplate(resolvedTemplateId);

  const renderTemplate = () => {
    switch (resolvedTemplateId) {
      case 'modern':
        return (
          <ModernView
            profile={profile}
            sectionsVisibility={sectionsVisibility}
            testimonials={testimonials}
          />
        );
      case 'minimal':
        return (
          <MinimalView
            profile={profile}
            sectionsVisibility={sectionsVisibility}
            testimonials={testimonials}
          />
        );
      case 'developer':
        return (
          <DeveloperView
            profile={profile}
            sectionsVisibility={sectionsVisibility}
            testimonials={testimonials}
          />
        );
      case 'creative':
        return (
          <CreativeView
            profile={profile}
            sectionsVisibility={sectionsVisibility}
            testimonials={testimonials}
          />
        );
      case 'classic':
        return (
          <ClassicView
            profile={profile}
            sectionsVisibility={sectionsVisibility}
            testimonials={testimonials}
          />
        );
      default: {
        const exhaustiveTemplate: never = resolvedTemplateId;
        return exhaustiveTemplate;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`w-full mx-auto py-12 px-6 ${
          template.publicWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {pdfUrl && (
              <a
                href={pdfUrl}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Download PDF
              </a>
            )}
            <ContactDialog profileId={profileId} profileName={profile.name} />
          </div>
          <Link
            href="/"
            className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Create yours</span>
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </div>

        <ProfileTypography headingFont={headingFont} bodyFont={bodyFont}>
          {renderTemplate()}
        </ProfileTypography>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Built with{' '}
            <Link
              href="/"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              OpenCV Builder
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
