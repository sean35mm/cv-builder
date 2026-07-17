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
import { ProfileLockButton } from '@/components/profile-lock-button';
import { ProfileShareDialog } from '@/components/profile-share-dialog';

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
  protectedProfile = false,
  hostBound = false,
  platformOrigin,
  canonicalUrl,
}: {
  profile: ProfileContent;
  pdfUrl?: string;
  sectionsVisibility?: Record<string, boolean>;
  profileId: Id<'profiles'>;
  templateId?: unknown;
  testimonials?: Testimonial[];
  headingFont?: ProfileFontId;
  bodyFont?: ProfileFontId;
  protectedProfile?: boolean;
  hostBound?: boolean;
  platformOrigin?: string;
  canonicalUrl: string;
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
        className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-10 ${
          template.publicWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl'
        }`}
      >
        <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b pb-3" aria-label="Profile actions">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
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
            <ContactDialog
              profileId={profileId}
              profileName={profile.name}
              username={profile.username}
              protectedProfile={protectedProfile}
              hostBound={hostBound}
            />
            {protectedProfile && <ProfileLockButton />}
            <ProfileShareDialog
              username={profile.username}
              canonicalUrl={canonicalUrl}
            />
          </div>
          <Link
            href={platformOrigin ?? '/'}
            className="group flex min-h-11 items-center gap-2 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <span>Create yours</span>
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </nav>

        <ProfileTypography headingFont={headingFont} bodyFont={bodyFont}>
          {renderTemplate()}
        </ProfileTypography>

        <footer className="mt-12 border-t pt-5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Published with{' '}
            <Link
              href={platformOrigin ?? '/'}
              className="inline-flex min-h-11 items-center font-medium text-foreground transition-colors duration-200 hover:text-primary"
            >
              OpenCV
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
