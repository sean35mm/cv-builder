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
  header: 'Profile',
  bio: 'About',
  contact: 'Contact',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  languages: 'Languages',
  projects: 'Projects',
  publications: 'Publications',
  certifications: 'Certifications',
  volunteering: 'Community',
  exhibitions: 'Exhibitions',
  awards: 'Awards',
  interests: 'Interests',
  testimonials: 'Recommendations',
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
  return (
    <h2 className="mb-6 text-lg font-semibold text-foreground">{label}</h2>
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

  const Section = ({ id }: { id: SectionId }) => {
    const label = SECTION_TITLES[id];

    if (id === 'header') {
      return (
        <header className="rounded-[28px] bg-secondary/80 p-6 sm:p-8">
          <div className="mb-7 flex items-center justify-between text-sm font-medium text-muted-foreground sm:mb-8">
            <span>{profile.industry || label}</span>
            {profile.location && <span>{profile.location}</span>}
          </div>
          <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <h1 className="min-w-0 max-w-4xl break-words text-3xl font-bold leading-[1.05] tracking-[-0.05em] text-foreground [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
              {profile.name}
            </h1>
            <ProfileAvatar
              src={profile.avatar}
              name={profile.name}
              className="rounded-md"
            />
          </div>
          <div className="mt-7 grid gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              {profile.title && (
                <p className="text-base font-semibold text-primary sm:text-lg">
                  {profile.title}
                </p>
              )}
              {profile.industry && (
                <p className="mt-1 text-muted-foreground">{profile.industry}</p>
              )}
            </div>
          </div>
        </header>
      );
    }

    if (id === 'bio') {
      return (
        <section className="grid gap-5 py-9 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-8 sm:py-11">
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
        <section className="grid gap-5 py-9 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-8 sm:py-11">
          <SectionHeading label={label} />
          <address className="not-italic">
            <ul className="space-y-2">
              {links.map((link) => (
                <li
                  key={link.label}
                  className="grid min-w-0 gap-1 rounded-xl bg-muted/50 p-3 text-sm sm:grid-cols-[100px_minmax(0,1fr)]"
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
        <section className="py-9 sm:py-11">
          <SectionHeading label={label} />
          <ol className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 rounded-2xl bg-muted/50 p-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-5"
              >
                <span className="text-xs leading-5 text-muted-foreground">
                  {entry.range}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-semibold text-foreground">
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
        <section className="grid gap-5 py-9 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-8 sm:py-11">
          <SectionHeading label={label} />
          <ul className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-secondary px-3 py-2 text-sm"
              >
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
          className="py-9 sm:py-11 [&_ol]:space-y-2 [&_ol]:border-0 [&_ol]:divide-y-0 [&_li]:rounded-xl [&_li]:bg-muted/45 [&_li]:p-4"
          headingClassName="mb-6 text-lg font-semibold text-foreground"
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
        <section className="py-9 sm:py-11">
          <SectionHeading label={label} />
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 rounded-2xl bg-muted/50 p-5 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-5"
              >
                <span className="text-xs text-muted-foreground">
                  {entry.year}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-foreground">
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
        <section className="py-9 sm:py-11">
          <SectionHeading label={label} />
          <ol className="space-y-3">
            {testimonials?.map((testimonial) => (
              <li
                key={testimonial._id}
                className="rounded-2xl bg-secondary/60 p-5"
              >
                <blockquote className="min-w-0">
                  <p className="whitespace-pre-line text-base leading-7 text-foreground/85">
                    “{testimonial.content}”
                  </p>
                  <footer className="mt-4 text-xs leading-5 text-muted-foreground">
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
    <article className="mx-auto w-full max-w-[1200px] min-w-0 overflow-hidden rounded-[32px] bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8 lg:px-12">
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      <main>
        {visibleSections.map((id) => (
          <Section key={id} id={id} />
        ))}
      </main>
    </article>
  );
}
