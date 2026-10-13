import type { ProfileContent, SectionsVisibility } from '@/lib/types';
import { paletteClassName } from '@/lib/palettes';
import { cn } from '@/lib/utils';
import { ProfileDocument } from '@/components/profile/profile-document';
import { ProfileLockButton } from '@/components/profile-lock-button';
import { ProfileShareDialog } from '@/components/profile-share-dialog';

const actionClassName =
  'inline-flex h-8 items-center rounded-md px-2.5 text-[13px] text-p-muted transition-colors duration-150 hover:bg-p-surface hover:text-p-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-accent pointer-coarse:h-11';

export function ProfilePublicView({
  profile,
  pdfUrl,
  sectionsVisibility,
  templateId,
  colorTheme,
  protectedProfile = false,
  platformOrigin,
  canonicalUrl,
}: {
  profile: ProfileContent;
  pdfUrl?: string;
  sectionsVisibility?: SectionsVisibility;
  templateId?: unknown;
  colorTheme?: unknown;
  protectedProfile?: boolean;
  platformOrigin?: string;
  canonicalUrl: string;
}) {
  return (
    <div
      className={cn(
        paletteClassName(colorTheme),
        'flex min-h-screen flex-col bg-p-bg font-sans text-p-fg'
      )}
    >
      <nav
        aria-label="Profile actions"
        className="flex flex-wrap justify-end gap-1 px-3 pt-3 print:hidden"
      >
        {pdfUrl && (
          <a href={pdfUrl} className={actionClassName}>
            Download PDF
          </a>
        )}
        <ProfileShareDialog
          username={profile.username}
          canonicalUrl={canonicalUrl}
          trigger={
            <button type="button" className={actionClassName}>
              Share
            </button>
          }
        />
        {protectedProfile && <ProfileLockButton className={actionClassName} />}
      </nav>

      <main className="flex-1">
        <ProfileDocument
          profile={profile}
          templateId={templateId}
          colorTheme={colorTheme}
          sectionsVisibility={sectionsVisibility}
        />
      </main>

      <footer className="px-6 pb-8 pt-4 text-center text-[12px] text-p-muted print:hidden">
        Made with{' '}
        <a
          href={platformOrigin ?? '/'}
          className="text-p-fg underline decoration-p-faint underline-offset-[3px] transition-colors duration-150 hover:decoration-p-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-accent"
        >
          OpenCV
        </a>
      </footer>
    </div>
  );
}
