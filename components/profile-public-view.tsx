import type { ProfileContent } from '@/lib/types';
import type { Id } from '@/convex/_generated/dataModel';
import { ContactDialog } from '@/components/contact/contact-dialog';
import { ClassicView } from '@/components/templates/classic-view';
import { ModernView } from '@/components/templates/modern-view';
import { MinimalView } from '@/components/templates/minimal-view';
import { CreativeView } from '@/components/templates/creative-view';
import { DeveloperView } from '@/components/templates/developer-view';
import { resolveTemplateId } from '@/lib/templates';
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
  const canvasWidth = {
    classic: 'max-w-[920px]',
    modern: 'max-w-[1120px]',
    minimal: 'max-w-[760px]',
    developer: 'max-w-[1200px]',
    creative: 'max-w-[1360px]',
  }[resolvedTemplateId];

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
    <div className="min-h-screen bg-background pb-24 sm:pb-28">
      <div
        className={`mx-auto w-full px-3 py-4 sm:px-6 sm:py-8 ${canvasWidth}`}
      >
        <ProfileTypography headingFont={headingFont} bodyFont={bodyFont}>
          {renderTemplate()}
        </ProfileTypography>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex min-h-14 items-center justify-between gap-2 overflow-x-auto border-t border-border bg-background p-2 text-foreground [&_a]:shrink-0 [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_button]:min-h-11 [&_button]:shrink-0 [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-ring"
          aria-label="Profile actions"
        >
          <div className="flex items-center gap-1">
            {pdfUrl && (
              <a
                href={pdfUrl}
                className="inline-flex min-h-11 items-center gap-1.5 rounded px-3 text-xs transition-colors duration-150 hover:bg-secondary"
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
            className="group flex min-h-11 items-center gap-2 rounded bg-foreground px-3 text-xs text-background transition-colors duration-150 hover:bg-foreground/85"
          >
            <span>Create yours</span>
            <span>→</span>
          </Link>
        </nav>

        <footer className="pt-5 text-center sm:text-right">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Published with{' '}
            <Link
              href={platformOrigin ?? '/'}
              className="inline-flex min-h-11 items-center font-medium text-foreground transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              OpenCV
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
