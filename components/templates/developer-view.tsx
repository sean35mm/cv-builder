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

type DeveloperViewProps = {
  profile: ProfileContent;
  sectionsVisibility?: Record<string, boolean>;
  testimonials?: ProfileTestimonial[];
};

const SECTION_TITLES: Record<SectionId, string> = {
  header: 'Identity',
  bio: 'Readme',
  contact: 'Interface',
  experience: 'Build log',
  education: 'Training',
  skills: 'Toolchain',
  languages: 'Languages',
  projects: 'Deployments',
  publications: 'Publications',
  certifications: 'Credentials',
  volunteering: 'Community log',
  exhibitions: 'Exhibitions',
  awards: 'Recognition',
  interests: 'Interests',
  testimonials: 'Peer notes',
};

const focusLinkClass =
  'break-words text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function sectionLabel(index: number, title: string) {
  return `${String(index + 1).padStart(2, '0')} / ${title}`;
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

function SectionHeading({ label }: { label: string }) {
  return (
    <h2 className="mb-6 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
      {label}
    </h2>
  );
}

export function DeveloperView({
  profile,
  sectionsVisibility,
  testimonials,
}: DeveloperViewProps) {
  const visibleSections = resolveVisibleSections(profile, {
    sectionsVisibility,
    testimonialCount: testimonials?.length,
  });
  const headerVisible = visibleSections.includes('header');

  const Section = ({ id, index }: { id: SectionId; index: number }) => {
    const label = sectionLabel(index, SECTION_TITLES[id]);

    if (id === 'header') {
      return (
        <header className="border-b-4 border-foreground pb-8 sm:pb-10">
          <div className="mb-8 flex items-center justify-between border-b border-border pb-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{label}</span>
            <span>Build log</span>
          </div>
          <div className="flex min-w-0 items-start justify-between gap-6">
            <h1 className="min-w-0 max-w-4xl break-words font-mono text-4xl font-bold leading-none tracking-[-0.06em] text-foreground [overflow-wrap:anywhere] sm:text-6xl lg:text-7xl">
              {profile.name}
            </h1>
            <ProfileAvatar
              src={profile.avatar}
              name={profile.name}
              className="rounded-md"
            />
          </div>
          <div className="mt-6 grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              {profile.title && (
                <p className="font-mono text-base font-semibold text-primary sm:text-lg">
                  {profile.title}
                </p>
              )}
              {profile.industry && (
                <p className="mt-1 text-muted-foreground">{profile.industry}</p>
              )}
            </div>
            {profile.location && (
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground sm:text-right">
                {profile.location}
              </p>
            )}
          </div>
        </header>
      );
    }

    if (id === 'bio') {
      return (
        <section className="border-b border-border py-8 sm:grid sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-8 sm:py-10">
          <SectionHeading label={label} />
          <p className="max-w-3xl whitespace-pre-line text-base leading-7 text-foreground/85">
            {profile.bio}
          </p>
        </section>
      );
    }

    if (id === 'contact') {
      const websiteUrl = normalizeExternalUrl(profile.website);
      const links = [
        profile.email && {
          label: 'Email',
          value: profile.email,
          href: `mailto:${profile.email}`,
          external: false,
        },
        profile.website && {
          label: 'Web',
          value: profile.website,
          href: websiteUrl,
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
        <section className="border-b border-border py-8 sm:grid sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-8 sm:py-10">
          <SectionHeading label={label} />
          <address className="not-italic">
            <ul className="divide-y divide-border border-y border-border">
              {links.map((link) => (
                <li
                  key={link.label}
                  className="grid min-w-0 gap-1 py-3 font-mono text-sm sm:grid-cols-[100px_minmax(0,1fr)]"
                >
                  <span className="text-muted-foreground">{link.label}</span>
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
        <section className="border-b border-border py-8 sm:py-10">
          <SectionHeading label={label} />
          <ol className="border-t border-border">
            {entries.map((entry, entryIndex) => (
              <li
                key={entry.id}
                className="grid gap-3 border-b border-border py-6 last:border-b-0 sm:grid-cols-[48px_140px_minmax(0,1fr)] sm:gap-5"
              >
                <span className="font-mono text-xs text-primary">
                  {String(entryIndex + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-xs leading-5 text-muted-foreground">
                  {entry.range}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words font-mono text-lg font-semibold text-foreground">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.organization}
                  </p>
                  {entry.description && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground/80">
                      {entry.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      );
    }

    if (id === 'skills') {
      return (
        <section className="border-b border-border py-8 sm:grid sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-8 sm:py-10">
          <SectionHeading label={label} />
          <ul className="grid border-t border-border sm:grid-cols-2">
            {profile.skills.map((skill, skillIndex) => (
              <li
                key={skill}
                className="grid grid-cols-[36px_minmax(0,1fr)] border-b border-border py-3 font-mono text-sm sm:odd:border-r sm:odd:pr-4 sm:even:pl-4"
              >
                <span className="text-primary">
                  {String(skillIndex + 1).padStart(2, '0')}
                </span>
                <span className="break-words text-foreground">{skill}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    if (id === 'languages' || id === 'publications' || id === 'interests') {
      return (
        <AdditionalProfileSection
          id={id}
          profile={profile}
          className="border-b border-border py-8 sm:py-10"
          headingClassName="mb-6 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-foreground"
        />
      );
    }

    if (id === 'projects') {
      return (
        <ProjectsSection
          profile={profile}
          variant="developer"
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
                  .join(' / '),
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
        <section className="border-b border-border py-8 sm:py-10">
          <SectionHeading label={label} />
          <ul className="divide-y divide-border border-y border-border">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 py-5 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-5"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {entry.year}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words font-mono font-semibold text-foreground">
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
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground/80">
                      {entry.description}
                    </p>
                  )}
                  {entry.link && (
                    <p className="mt-3 text-sm">
                      <ExternalProfileLink
                        value={entry.link}
                        href={normalizeExternalUrl(entry.link)}
                      />
                    </p>
                  )}
                  <EntryMediaGrid images={entry.images} title={entry.title} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    if (id === 'testimonials') {
      return (
        <section className="border-b border-border py-8 sm:py-10">
          <SectionHeading label={label} />
          <ol className="divide-y divide-border border-y border-border">
            {testimonials?.map((testimonial, testimonialIndex) => (
              <li
                key={testimonial._id}
                className="grid gap-4 py-6 sm:grid-cols-[48px_minmax(0,1fr)]"
              >
                <span className="font-mono text-xs text-primary">
                  {String(testimonialIndex + 1).padStart(2, '0')}
                </span>
                <blockquote className="min-w-0">
                  <p className="whitespace-pre-line text-base leading-7 text-foreground/85">
                    “{testimonial.content}”
                  </p>
                  <footer className="mt-4 font-mono text-xs leading-5 text-muted-foreground">
                    <cite className="not-italic text-foreground">
                      {testimonial.authorName}
                    </cite>
                    {testimonial.authorTitle && ` / ${testimonial.authorTitle}`}
                    {testimonial.authorCompany &&
                      ` / ${testimonial.authorCompany}`}
                    <span className="block">{testimonial.relationship}</span>
                    {testimonial.rating && (
                      <span className="block">
                        Rating: {testimonial.rating} / 5
                      </span>
                    )}
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
    <article className="w-full min-w-0 overflow-hidden border border-border bg-card px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      <main>
        {visibleSections.map((id, index) => (
          <Section key={id} id={id} index={index} />
        ))}
      </main>
    </article>
  );
}
