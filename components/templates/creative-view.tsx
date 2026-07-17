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

function sectionLabel(index: number, title: string) {
  return `${String(index + 1).padStart(2, '0')} — ${title}`;
}

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

function EditorialHeading({ label }: { label: string }) {
  return (
    <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </h2>
  );
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

  const Section = ({ id, index }: { id: SectionId; index: number }) => {
    const label = sectionLabel(index, SECTION_TITLES[id]);

    if (id === 'header') {
      return (
        <header className="border-b border-foreground/70 pb-10 sm:pb-14">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{label}</span>
            {profile.industry && <span>{profile.industry}</span>}
          </div>
          <div className="flex min-w-0 items-start justify-between gap-6">
            <h1 className="min-w-0 max-w-5xl break-words font-serif text-5xl leading-[0.88] tracking-[-0.055em] text-foreground [overflow-wrap:anywhere] sm:text-7xl lg:text-8xl">
              {profile.name}
            </h1>
            <ProfileAvatar
              src={profile.avatar}
              name={profile.name}
              className="h-24 w-24 rounded-none sm:h-28 sm:w-28"
            />
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.5fr)] sm:items-end">
            {profile.title && (
              <p className="max-w-2xl text-2xl leading-tight text-primary sm:text-3xl">
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
        <section className="grid gap-8 border-b border-border py-12 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <EditorialHeading label={label} />
          <p className="max-w-3xl whitespace-pre-line text-2xl leading-snug text-foreground sm:text-3xl">
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
        <section className="grid gap-8 border-b border-border py-12 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <EditorialHeading label={label} />
          <address className="not-italic">
            <ul className="border-t border-foreground/70">
              {links.map((link) => (
                <li
                  key={link.label}
                  className="grid min-w-0 gap-2 border-b border-border py-4 text-sm sm:grid-cols-[120px_minmax(0,1fr)]"
                >
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
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
              range: formatRange(
                entry.startDate,
                entry.endDate,
                entry.current
              ),
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
        <section className="grid gap-8 border-b border-border py-12 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <EditorialHeading label={label} />
          <ol className="border-t border-foreground/70">
            {entries.map((entry, entryIndex) => (
              <li
                key={entry.id}
                className="grid gap-4 border-b border-border py-7 md:grid-cols-[48px_minmax(0,1fr)_150px]"
              >
                <span className="font-mono text-xs text-primary">
                  {String(entryIndex + 1).padStart(2, '0')}
                </span>
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
                <p className="font-mono text-xs leading-5 text-muted-foreground md:text-right">
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
        <section className="grid gap-8 border-b border-border py-12 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <EditorialHeading label={label} />
          <ol className="grid border-t border-foreground/70 sm:grid-cols-2">
            {profile.skills.map((skill, skillIndex) => (
              <li
                key={skill}
                className="grid grid-cols-[40px_minmax(0,1fr)] border-b border-border py-4 sm:odd:border-r sm:odd:pr-5 sm:even:pl-5"
              >
                <span className="font-mono text-xs text-primary">
                  {String(skillIndex + 1).padStart(2, '0')}
                </span>
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
          className="border-b border-border py-12 sm:py-16"
          headingClassName="mb-8 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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
        <section className="grid gap-8 border-b border-border py-12 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <EditorialHeading label={label} />
          <ul className="border-t border-foreground/70">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 border-b border-border py-6 md:grid-cols-[minmax(0,1fr)_100px]"
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
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
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
                <span className="font-mono text-xs text-muted-foreground md:text-right">
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
        <section className="grid gap-8 border-b border-border py-12 sm:grid-cols-[minmax(120px,0.65fr)_minmax(0,2.35fr)] sm:py-16">
          <EditorialHeading label={label} />
          <ol className="border-t border-foreground/70">
            {testimonials?.map((testimonial) => (
              <li key={testimonial._id} className="border-b border-border py-8">
                <blockquote>
                  <p className="whitespace-pre-line text-2xl leading-snug text-foreground sm:text-3xl">
                    “{testimonial.content}”
                  </p>
                  <footer className="mt-6 text-sm leading-6 text-muted-foreground">
                    <cite className="not-italic text-foreground">
                      {testimonial.authorName}
                    </cite>
                    {testimonial.authorTitle && `, ${testimonial.authorTitle}`}
                    {testimonial.authorCompany &&
                      ` — ${testimonial.authorCompany}`}
                    <span className="block font-mono text-xs">
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
    <article className="w-full min-w-0 overflow-hidden border border-border bg-card px-5 py-7 sm:px-10 sm:py-10 lg:px-14">
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      <main>
        {visibleSections.map((id, index) => (
          <Section key={id} id={id} index={index} />
        ))}
      </main>
    </article>
  );
}
