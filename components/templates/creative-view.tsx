import { ProjectsSection } from '@/components/profile/sections/ProjectsSection';
import { AdditionalProfileSection } from '@/components/profile/sections/additional-profile-section';
import {
  displayUrl,
  formatRange,
  normalizeExternalUrl,
} from '@/lib/profile-format';
import { resolveVisibleSections } from '@/lib/profile/rendering';
import type {
  ProfileContent,
  ProfileTestimonial,
  SectionId,
} from '@/lib/types';
import {
  EntryMediaGrid,
  ProfileAvatar,
} from '@/components/profile/profile-media';

type CreativeViewProps = {
  profile: ProfileContent;
  sectionsVisibility?: Record<string, boolean>;
  testimonials?: ProfileTestimonial[];
};

const SECTION_TITLES: Record<SectionId, string> = {
  header: 'Studio folio',
  bio: 'Profile',
  contact: 'Contact',
  experience: 'Practice',
  education: 'Education',
  skills: 'Capabilities',
  languages: 'Languages',
  projects: 'Selected work',
  publications: 'Publications',
  certifications: 'Credentials',
  volunteering: 'Community',
  exhibitions: 'Exhibitions',
  awards: 'Awards',
  interests: 'Interests',
  testimonials: 'Notes from collaborators',
};

const focusLinkClass =
  'break-words text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function socialUrl(value: string, baseUrl: string) {
  const trimmed = value.trim();
  const isUrl =
    /^https?:\/\//i.test(trimmed) ||
    trimmed.includes('://') ||
    /^[^/]+\.[^/]+\//.test(trimmed);
  return normalizeExternalUrl(
    isUrl ? trimmed : `${baseUrl}${trimmed.replace(/^@/, '')}`
  );
}

function ExternalProfileLink({
  value,
  href,
}: {
  value?: string;
  href?: string;
}) {
  if (!value) return null;
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={focusLinkClass}
    >
      {displayUrl(value) ?? value}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <span className="break-words text-muted-foreground">{value}</span>
  );
}

function SectionHeading({ label }: { label: string }) {
  return <h2 className="text-lg font-semibold text-foreground">{label}</h2>;
}

export function CreativeView({
  profile,
  sectionsVisibility,
  testimonials,
}: CreativeViewProps) {
  const visibleSections = resolveVisibleSections(profile, {
    sectionsVisibility,
    testimonialCount: testimonials?.length,
  });
  const headerVisible = visibleSections.includes('header');

  const Section = ({ id }: { id: SectionId }) => {
    const label = SECTION_TITLES[id];

    if (id === 'header') {
      return (
        <header className="rounded-[32px] bg-primary/10 p-6 sm:p-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-muted-foreground sm:mb-10">
            <span>{profile.title || label}</span>
            {profile.industry && <span>{profile.industry}</span>}
          </div>
          <div className="grid min-w-0 gap-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <h1 className="min-w-0 max-w-4xl break-words font-serif text-4xl leading-[0.95] tracking-[-0.045em] text-foreground [overflow-wrap:anywhere] sm:text-6xl lg:text-7xl">
              {profile.name}
            </h1>
            <ProfileAvatar
              src={profile.avatar}
              name={profile.name}
              className="h-20 w-20 rounded-3xl sm:h-28 sm:w-28"
            />
          </div>
          <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.5fr)] sm:items-end">
            {profile.title && (
              <p className="max-w-2xl text-xl leading-tight text-primary sm:text-3xl">
                {profile.title}
              </p>
            )}
            {profile.location && (
              <p className="text-sm text-muted-foreground sm:text-right">
                {profile.location}
              </p>
            )}
          </div>
        </header>
      );
    }

    if (id === 'bio') {
      return (
        <section className="grid gap-7 rounded-[28px] bg-secondary/55 p-6 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:p-10">
          <SectionHeading label={label} />
          <p className="max-w-3xl whitespace-pre-line text-xl leading-snug text-foreground sm:text-3xl">
            {profile.bio}
          </p>
        </section>
      );
    }

    if (id === 'contact') {
      const links = [
        profile.email && {
          label: 'Email',
          value: profile.email,
          href: `mailto:${profile.email}`,
          external: false,
        },
        profile.website && {
          label: 'Website',
          value: profile.website,
          href: normalizeExternalUrl(profile.website),
          external: true,
        },
        profile.github && {
          label: 'GitHub',
          value: profile.github,
          href: socialUrl(profile.github, 'https://github.com/'),
          external: true,
        },
        profile.linkedin && {
          label: 'LinkedIn',
          value: profile.linkedin,
          href: socialUrl(profile.linkedin, 'https://linkedin.com/in/'),
          external: true,
        },
        profile.twitter && {
          label: 'Social',
          value: profile.twitter,
          href: socialUrl(profile.twitter, 'https://x.com/'),
          external: true,
        },
      ].filter(Boolean) as Array<{
        label: string;
        value: string;
        href?: string;
        external: boolean;
      }>;

      return (
        <section className="grid gap-7 py-10 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <SectionHeading label={label} />
          <address className="not-italic">
            <ul className="space-y-2">
              {links.map((link) => (
                <li
                  key={link.label}
                  className="grid min-w-0 gap-2 rounded-2xl bg-muted/55 p-4 text-sm sm:grid-cols-[120px_minmax(0,1fr)]"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {link.label}
                  </span>
                  {link.href ? (
                    <a
                      href={link.href}
                      {...(link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className={focusLinkClass}
                    >
                      {link.value}
                      {link.external && (
                        <span className="sr-only"> (opens in a new tab)</span>
                      )}
                    </a>
                  ) : (
                    <span className="break-words text-muted-foreground">
                      {link.value}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </address>
        </section>
      );
    }

    if (id === 'experience' || id === 'education' || id === 'volunteering') {
      const entries =
        id === 'experience'
          ? profile.experience.map((entry) => ({
              id: entry.id,
              title: entry.role,
              organization: entry.company,
              range: formatRange(entry.startDate, entry.endDate, entry.current),
              description: entry.description,
            }))
          : id === 'education'
            ? profile.education.map((entry) => ({
                id: entry.id,
                title: entry.degree,
                organization: entry.school,
                range: formatRange(
                  entry.startDate,
                  entry.endDate,
                  entry.current
                ),
                description: entry.description,
              }))
            : profile.volunteering.map((entry) => ({
                id: entry.id,
                title: entry.role,
                organization: entry.organization,
                range: formatRange(
                  entry.startDate,
                  entry.endDate,
                  entry.current
                ),
                description: entry.description,
              }));

      return (
        <section className="grid gap-7 py-10 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <SectionHeading label={label} />
          <ol className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-4 rounded-[24px] bg-muted/50 p-5 md:grid-cols-[minmax(0,1fr)_150px]"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-serif text-2xl leading-tight text-foreground">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.organization}
                  </p>
                  {entry.description && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground/75">
                      {entry.description}
                    </p>
                  )}
                </div>
                <p className="text-xs leading-5 text-muted-foreground md:text-right">
                  {entry.range}
                </p>
              </li>
            ))}
          </ol>
        </section>
      );
    }

    if (id === 'skills') {
      return (
        <section className="grid gap-7 rounded-[28px] bg-primary/8 p-6 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:p-10">
          <SectionHeading label={label} />
          <ol className="grid gap-2 sm:grid-cols-2">
            {profile.skills.map((skill) => (
              <li key={skill} className="rounded-2xl bg-background/70 p-4">
                <span className="break-words text-lg text-foreground">
                  {skill}
                </span>
              </li>
            ))}
          </ol>
        </section>
      );
    }

    if (id === 'languages' || id === 'publications' || id === 'interests') {
      return (
        <AdditionalProfileSection
          id={id}
          profile={profile}
          className="py-10 sm:py-16 [&_ol]:grid [&_ol]:gap-3 [&_ol]:border-0 [&_ol]:divide-y-0 sm:[&_ol]:grid-cols-2 [&_li]:rounded-2xl [&_li]:bg-secondary/55 [&_li]:p-5"
          headingClassName="mb-8 text-lg font-semibold text-foreground"
        />
      );
    }

    if (id === 'projects') {
      return (
        <ProjectsSection
          profile={profile}
          variant="creative"
          sectionLabel={label}
        />
      );
    }

    if (id === 'certifications' || id === 'exhibitions' || id === 'awards') {
      const entries =
        id === 'certifications'
          ? profile.certifications.map((entry) => ({
              id: entry.id,
              title: entry.name,
              source: entry.issuer,
              year: entry.year,
              detail: entry.credentialId
                ? `Credential ID: ${entry.credentialId}`
                : undefined,
              description: entry.description,
              link: entry.link,
              images: undefined,
            }))
          : id === 'exhibitions'
            ? profile.exhibitions.map((entry) => ({
                id: entry.id,
                title: entry.title,
                source: [entry.venue, entry.location]
                  .filter(Boolean)
                  .join(' — '),
                year: entry.year,
                description: entry.description,
                link: entry.link,
                images: entry.images,
              }))
            : profile.awards.map((entry) => ({
                id: entry.id,
                title: entry.title,
                source: entry.issuer,
                year: entry.year,
                description: entry.description,
                link: entry.link,
                images: entry.images,
              }));

      return (
        <section className="grid gap-7 py-10 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <SectionHeading label={label} />
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 rounded-[24px] bg-muted/50 p-5 md:grid-cols-[minmax(0,1fr)_100px]"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-serif text-2xl text-foreground">
                    {entry.title}
                  </h3>
                  {entry.source && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.source}
                    </p>
                  )}
                  {'detail' in entry && entry.detail && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.detail}
                    </p>
                  )}
                  {entry.description && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground/75">
                      {entry.description}
                    </p>
                  )}
                  {entry.link && (
                    <p className="mt-4 text-sm">
                      <ExternalProfileLink
                        value={entry.link}
                        href={normalizeExternalUrl(entry.link)}
                      />
                    </p>
                  )}
                  <EntryMediaGrid images={entry.images} title={entry.title} />
                </div>
                <span className="text-xs text-muted-foreground md:text-right">
                  {entry.year}
                </span>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    if (id === 'testimonials') {
      return (
        <section className="grid gap-7 py-10 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <SectionHeading label={label} />
          <ol className="space-y-3">
            {testimonials?.map((testimonial) => (
              <li
                key={testimonial._id}
                className="rounded-[24px] bg-secondary/60 p-6"
              >
                <blockquote>
                  <p className="whitespace-pre-line text-xl leading-snug text-foreground sm:text-3xl">
                    “{testimonial.content}”
                  </p>
                  <footer className="mt-6 text-sm leading-6 text-muted-foreground">
                    <cite className="not-italic text-foreground">
                      {testimonial.authorName}
                    </cite>
                    {testimonial.authorTitle && `, ${testimonial.authorTitle}`}
                    {testimonial.authorCompany &&
                      ` — ${testimonial.authorCompany}`}
                    <span className="block text-xs">
                      {testimonial.relationship}
                      {testimonial.rating &&
                        ` / Rating ${testimonial.rating} of 5`}
                    </span>
                  </footer>
                </blockquote>
              </li>
            ))}
          </ol>
        </section>
      );
    }

    return null;
  };

  return (
    <article className="mx-auto w-full max-w-[1360px] min-w-0 space-y-5 overflow-hidden rounded-[36px] bg-card px-5 py-7 shadow-sm sm:px-10 sm:py-10 lg:px-14 lg:py-12">
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      <main>
        {visibleSections.map((id) => (
          <Section key={id} id={id} />
        ))}
      </main>
    </article>
  );
}
