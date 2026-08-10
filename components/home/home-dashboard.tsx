import Link from 'next/link';
import { ArrowRight, Check, Circle, ExternalLink } from 'lucide-react';
import type { Doc } from '@/convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  resolveProfileAccessMode,
  type ProfileAccessMode,
} from '@/lib/profile/access';

type ProfileStats = {
  totalViews: number;
  totalPdfDownloads: number;
  isCapped: boolean;
};

type ChecklistItem = {
  key: string;
  title: string;
  description: string;
  complete: boolean;
  href: string;
  action: string;
};

const ACCESS_STATUS: Record<
  ProfileAccessMode,
  { label: string; description: string }
> = {
  private: {
    label: 'Private',
    description: 'Only you can access this profile.',
  },
  passcode: {
    label: 'Passcode protected',
    description: 'Visitors need your passcode to view it.',
  },
  unlisted: {
    label: 'Unlisted',
    description: 'Anyone with the direct link can view it.',
  },
  public: {
    label: 'Public and discoverable',
    description: 'Your profile can appear in the public directory.',
  },
};

const hasText = (value: string | undefined) => Boolean(value?.trim());

function buildChecklist(profile: Doc<'profiles'>): ChecklistItem[] {
  const accessMode = resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );
  const hasIdentity =
    hasText(profile.name) && (hasText(profile.title) || hasText(profile.bio));
  const hasBackground =
    profile.experience.length > 0 || profile.education.length > 0;
  const hasProof = Boolean(
    profile.projects?.length ||
    profile.publications?.length ||
    profile.certifications?.length ||
    profile.exhibitions?.length ||
    profile.awards?.length ||
    hasText(profile.website) ||
    hasText(profile.github)
  );
  const hasAppearance = true;
  const isPreviewReady = hasIdentity && (hasBackground || hasProof);
  const isShareReady = accessMode !== 'private';

  return [
    {
      key: 'identity',
      title: 'Identity and introduction',
      description: 'Add your name and a clear headline or introduction.',
      complete: hasIdentity,
      href: '/editor',
      action: 'Write your introduction',
    },
    {
      key: 'background',
      title: 'Experience or education',
      description: 'Give readers useful context for your work.',
      complete: hasBackground,
      href: '/editor',
      action: 'Add your background',
    },
    {
      key: 'proof',
      title: 'Project or proof',
      description:
        'Show a project, credential, publication, award, or work link.',
      complete: hasProof,
      href: '/editor',
      action: 'Add proof of your work',
    },
    {
      key: 'appearance',
      title: 'Appearance',
      description: 'Choose a presentation that supports your content.',
      complete: hasAppearance,
      href: '/appearance',
      action: 'Choose your appearance',
    },
    {
      key: 'preview',
      title: 'Preview readiness',
      description: 'Your introduction and supporting work are ready to review.',
      complete: isPreviewReady,
      href: '/editor',
      action: 'Prepare your preview',
    },
    {
      key: 'access',
      title: 'Publication and discovery',
      description:
        accessMode === 'public'
          ? 'Public discovery is enabled.'
          : accessMode === 'unlisted'
            ? 'Direct-link sharing is enabled.'
            : accessMode === 'passcode'
              ? 'Protected sharing is enabled.'
              : 'Choose how other people can access your profile.',
      complete: isShareReady,
      href: '/publish',
      action: 'Choose profile access',
    },
  ];
}

export function HomeWithoutProfile() {
  return (
    <main
      className="mx-auto min-h-screen max-w-[84rem] px-4 py-8 sm:px-6 md:py-12 lg:px-10"
      data-route-landmark="home-no-profile"
    >
      <section className="border-y border-border py-8 sm:py-12">
        <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
          Create your profile
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Add your identity, work, and contact details. You can choose access
          settings when you are ready to share it.
        </p>
        <Button asChild className="mt-7">
          <Link href="/editor">
            Create profile
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </main>
  );
}

export function HomeDashboard({
  profile,
  stats,
}: {
  profile: Doc<'profiles'>;
  stats: ProfileStats | undefined;
}) {
  const checklist = buildChecklist(profile);
  const completeCount = checklist.filter((item) => item.complete).length;
  const progress = Math.round((completeCount / checklist.length) * 100);
  const nextIncomplete = checklist.find((item) => !item.complete);
  const accessMode = resolveProfileAccessMode(
    profile.isPublic,
    profile.isDirectoryListed,
    profile.accessMode
  );
  const accessStatus = ACCESS_STATUS[accessMode];
  const profileHref = `/@${profile.username}`;
  const nextAction = nextIncomplete ?? {
    href: profileHref,
    action: 'View your profile',
  };
  const remainingCount = checklist.length - completeCount;
  const isComplete = remainingCount === 0;
  const activityPrefix = stats?.isCapped ? '≥ ' : '';
  const initials = (profile.name || profile.username)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <main
      className="mx-auto min-h-screen max-w-[84rem] px-4 py-8 sm:px-6 md:py-12 lg:px-10"
      data-route-landmark="home"
    >
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
          Profile
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-0">
        <div className="space-y-10 lg:col-span-8 lg:pr-8">
          <section
            className="border-y border-border py-6"
            aria-labelledby="profile-card-title"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div
                className="flex size-20 shrink-0 items-center justify-center rounded-full bg-secondary bg-cover bg-center font-display text-2xl font-semibold text-foreground"
                style={
                  profile.avatar
                    ? { backgroundImage: `url(${profile.avatar})` }
                    : undefined
                }
                role={profile.avatar ? 'img' : undefined}
                aria-label={
                  profile.avatar
                    ? `${profile.name || profile.username} avatar`
                    : undefined
                }
              >
                {!profile.avatar && initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="profile-card-title"
                    className="text-2xl font-semibold tracking-[-0.03em]"
                  >
                    {profile.name || `@${profile.username}`}
                  </h2>
                  <Badge variant="outline">{accessStatus.label}</Badge>
                </div>
                {profile.title && (
                  <p className="mt-1 text-muted-foreground">{profile.title}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="font-mono text-sm text-muted-foreground">
                    opencv.app/@{profile.username}
                  </span>
                  {accessMode !== 'private' && (
                    <Link
                      href={profileHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent hover:underline"
                    >
                      Open profile{' '}
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
              {accessStatus.description}
            </p>
          </section>

          <section
            className="bg-secondary/50 px-5 py-6 sm:px-6"
            aria-labelledby="next-action-title"
          >
            <p className="text-sm font-medium text-muted-foreground">
              Next action
            </p>
            <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h2
                  id="next-action-title"
                  className="font-display text-2xl font-semibold tracking-[-0.02em]"
                >
                  {isComplete
                    ? 'Review your public profile'
                    : nextIncomplete?.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  {isComplete
                    ? 'All readiness items are complete.'
                    : nextIncomplete?.description}
                </p>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link
                  href={nextAction.href}
                  target={!nextIncomplete ? '_blank' : undefined}
                  rel={!nextIncomplete ? 'noopener noreferrer' : undefined}
                >
                  {nextAction.action}
                  {!nextIncomplete && <ExternalLink aria-hidden="true" />}
                </Link>
              </Button>
            </div>
          </section>

          <section
            className={`border-y border-border ${isComplete ? 'py-4' : 'py-6'}`}
            aria-labelledby="readiness-title"
          >
            {isComplete ? (
              <div className="flex items-center justify-between gap-4">
                <h2 id="readiness-title" className="text-sm font-medium">
                  Profile readiness
                </h2>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check aria-hidden="true" className="size-4 text-accent" />
                  Complete
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-4">
                  <h2
                    id="readiness-title"
                    className="font-display text-2xl font-semibold"
                  >
                    Profile readiness
                  </h2>
                  <p className="font-mono text-sm text-muted-foreground">
                    {completeCount}/{checklist.length}
                  </p>
                </div>
                <div
                  className="mt-5 h-1 overflow-hidden bg-secondary"
                  role="progressbar"
                  aria-label="Profile readiness"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <ul className="mt-6 divide-y divide-border border-y border-border">
                  {checklist
                    .filter((item) => !item.complete)
                    .map((item) => (
                      <li
                        key={item.key}
                        className="flex min-h-11 items-center gap-3 px-1 py-3"
                      >
                        <Circle
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                        <span className="text-sm">{item.title}</span>
                        <span className="sr-only">Not complete</span>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </section>
        </div>

        <aside
          className="border-y border-border py-6 lg:col-span-4 lg:border-y-0 lg:border-l lg:py-0 lg:pl-8"
          aria-labelledby="now-title"
        >
          <h2
            id="now-title"
            className="font-display text-2xl font-semibold tracking-[-0.02em]"
          >
            Activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Last 30 days</p>
          <div className="mt-8 grid grid-cols-2 divide-x divide-border border-y border-border">
            <div className="py-4 pr-4">
              <p className="font-display text-3xl">
                {stats ? `${activityPrefix}${stats.totalViews}` : '—'}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Profile views
              </p>
            </div>
            <div className="py-4 pl-4">
              <p className="font-display text-3xl">
                {stats ? `${activityPrefix}${stats.totalPdfDownloads}` : '—'}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                PDF downloads
              </p>
            </div>
          </div>
          <div className="mt-6 divide-y divide-border border-y border-border">
            <NowLink href="/inbox" label="Messages" />
            <NowLink href="/testimonials" label="Recommendations" />
          </div>
          <Button asChild variant="outline" className="mt-8 w-full">
            <Link href="/activity">
              See all activity
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p
            className="mt-5 text-xs leading-5 text-muted-foreground"
            role="status"
          >
            {!stats
              ? 'Loading profile activity.'
              : profile.analyticsEnabled === false
                ? 'Tracking is off. Existing activity remains available.'
                : stats.isCapped
                  ? 'Totals shown are minimums for this period.'
                  : 'Activity reflects recorded visits and downloads.'}
          </p>
        </aside>
      </div>
    </main>
  );
}

function NowLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center px-1 py-3 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
    </Link>
  );
}
