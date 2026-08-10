import { displayUrl, formatRange } from '@/lib/profile-format';
import type { ProfileContent, SectionId } from '@/lib/types';
import {
  hasContactContent,
  resolveVisibleSections,
} from '@/lib/profile/rendering';
import { ProjectsSection } from '@/components/profile/sections/ProjectsSection';
import { AdditionalProfileSection } from '@/components/profile/sections/additional-profile-section';
import {
  EntryMediaGrid,
  ProfileAvatar,
} from '@/components/profile/profile-media';

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

type MinimalViewProps = {
  profile: ProfileContent;
  sectionsVisibility?: Record<string, boolean>;
  testimonials?: Testimonial[];
};

export function MinimalView({
  profile,
  sectionsVisibility,
  testimonials,
}: MinimalViewProps) {
  const visibleSections = resolveVisibleSections(profile, {
    sectionsVisibility,
    testimonialCount: testimonials?.length,
  });
  const hasContact = hasContactContent(profile);
  const headerVisible = visibleSections.includes('header');

  const Section = ({ id }: { id: SectionId }) => {
    if (id === 'header') {
      return (
        <header className="mb-14 min-w-0 sm:mb-20">
          <div className="grid min-w-0 gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <h1 className="min-w-0 break-words text-4xl font-light leading-[1.08] tracking-[-0.035em] text-foreground [overflow-wrap:anywhere] sm:text-5xl">
                {profile.name}
              </h1>
              {profile.title && (
                <p className="mt-5 max-w-xl text-xl font-light leading-snug text-foreground/75 sm:text-2xl">
                  {profile.title}
                </p>
              )}
              {profile.location && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {profile.location}
                </p>
              )}
            </div>
            <ProfileAvatar
              src={profile.avatar}
              name={profile.name}
              className="rounded-2xl"
            />
          </div>
        </header>
      );
    }

    if (id === 'contact') {
      if (!hasContact) return null;
      return (
        <address className="mb-14 break-words text-sm leading-7 text-muted-foreground not-italic [overflow-wrap:anywhere]">
          {[
            profile.email,
            profile.website && displayUrl(profile.website),
            profile.github && `github.com/${profile.github}`,
            profile.linkedin && `linkedin.com/in/${profile.linkedin}`,
            profile.twitter && `@${profile.twitter}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </address>
      );
    }

    if (id === 'bio') {
      return profile.bio ? (
        <p className="mb-16 max-w-2xl whitespace-pre-line text-lg leading-8 text-foreground/75">
          {profile.bio}
        </p>
      ) : null;
    }

    if (id === 'experience') {
      if (!Array.isArray(profile.experience) || profile.experience.length === 0)
        return null;
      return (
        <section className="mb-16">
          <h2 className="mb-8 text-sm font-medium text-muted-foreground">
            Experience
          </h2>
          <div className="space-y-9">
            {profile.experience.map((exp) => (
              <div key={exp.id}>
                <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <h3 className="text-lg font-medium text-foreground">
                    {exp.role}
                  </h3>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                <p className="text-muted-foreground">{exp.company}</p>
                {exp.description && (
                  <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-foreground/70">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (id === 'education') {
      if (!Array.isArray(profile.education) || profile.education.length === 0)
        return null;
      return (
        <section className="mb-16">
          <h2 className="mb-8 text-sm font-medium text-muted-foreground">
            Education
          </h2>
          <div className="space-y-9">
            {profile.education.map((edu) => (
              <div key={edu.id}>
                <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <h3 className="text-lg font-medium text-foreground">
                    {edu.degree}
                  </h3>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatRange(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                <p className="text-muted-foreground">{edu.school}</p>
                {edu.description && (
                  <p className="mt-3 text-sm leading-7 text-foreground/70">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (id === 'skills') {
      if (!Array.isArray(profile.skills) || profile.skills.length === 0)
        return null;
      return (
        <section className="mb-16">
          <h2 className="mb-6 text-sm font-medium text-muted-foreground">
            Skills
          </h2>
          <p className="max-w-2xl text-base leading-8 text-foreground/80">
            {profile.skills.join(' / ')}
          </p>
        </section>
      );
    }

    if (id === 'languages' || id === 'publications' || id === 'interests') {
      return (
        <AdditionalProfileSection
          id={id}
          profile={profile}
          className="mb-16 [&_ol]:space-y-5 [&_ol]:border-0 [&_ol]:divide-y-0"
          headingClassName="mb-6 text-sm font-medium text-muted-foreground"
        />
      );
    }

    if (id === 'projects') {
      return (
        <section className="mb-16 rounded-[28px] bg-muted/45 p-5 sm:p-8 [&>div]:mb-0">
          <ProjectsSection profile={profile} variant="minimal" />
        </section>
      );
    }

    if (id === 'certifications') {
      if (
        !Array.isArray(profile.certifications) ||
        profile.certifications.length === 0
      )
        return null;
      return (
        <section className="mb-16">
          <h2 className="mb-6 text-sm font-medium text-muted-foreground">
            Certifications
          </h2>
          <div className="space-y-3">
            {profile.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-baseline"
              >
                <div>
                  <span className="text-foreground">{cert.name}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    — {cert.issuer}
                  </span>
                </div>
                {cert.year && (
                  <span className="text-sm text-muted-foreground">
                    {cert.year}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (id === 'volunteering') {
      if (
        !Array.isArray(profile.volunteering) ||
        profile.volunteering.length === 0
      )
        return null;
      return (
        <section className="mb-16">
          <h2 className="mb-8 text-sm font-medium text-muted-foreground">
            Volunteering
          </h2>
          <div className="space-y-6">
            {profile.volunteering.map((vol) => (
              <div
                key={vol.id}
                className="border-b border-border pb-6 last:border-0 last:pb-0"
              >
                <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <h3 className="text-lg font-medium text-foreground">
                    {vol.role}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {formatRange(vol.startDate, vol.endDate, vol.current)}
                  </span>
                </div>
                <p className="text-muted-foreground">{vol.organization}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (id === 'exhibitions') {
      if (
        !Array.isArray(profile.exhibitions) ||
        profile.exhibitions.length === 0
      )
        return null;
      return (
        <section className="mb-16">
          <h2 className="mb-6 text-sm font-medium text-muted-foreground">
            Exhibitions
          </h2>
          <div className="space-y-7">
            {profile.exhibitions.map((exh) => (
              <div key={exh.id}>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-baseline">
                  <div>
                    <span className="text-foreground">{exh.title}</span>
                    {exh.venue && (
                      <span className="text-muted-foreground">
                        {' '}
                        — {exh.venue}
                      </span>
                    )}
                  </div>
                  {exh.year && (
                    <span className="text-sm text-muted-foreground">
                      {exh.year}
                    </span>
                  )}
                </div>
                <EntryMediaGrid images={exh.images} title={exh.title} />
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (id === 'awards') {
      if (!Array.isArray(profile.awards) || profile.awards.length === 0)
        return null;
      return (
        <section className="mb-16">
          <h2 className="mb-6 text-sm font-medium text-muted-foreground">
            Awards
          </h2>
          <div className="space-y-7">
            {profile.awards.map((award) => (
              <div key={award.id}>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-baseline">
                  <div>
                    <span className="text-foreground">{award.title}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      — {award.issuer}
                    </span>
                  </div>
                  {award.year && (
                    <span className="text-sm text-muted-foreground">
                      {award.year}
                    </span>
                  )}
                </div>
                <EntryMediaGrid images={award.images} title={award.title} />
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (id === 'testimonials') {
      if (!testimonials || testimonials.length === 0) return null;
      return (
        <section className="mb-16">
          <h2 className="mb-8 text-sm font-medium text-muted-foreground">
            Testimonials
          </h2>
          <div className="space-y-8">
            {testimonials.map((t) => (
              <div key={t._id}>
                <p className="text-lg font-light italic leading-8 text-foreground/75">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="text-foreground">{t.authorName}</span>
                  {t.authorTitle && <>, {t.authorTitle}</>}
                  {t.authorCompany && <>, {t.authorCompany}</>}
                  {' \u00b7 '}
                  <span>{t.relationship}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <article className="mx-auto w-full max-w-[760px] min-w-0 overflow-hidden bg-card px-5 py-10 sm:px-12 sm:py-14">
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      {visibleSections.map((id) => (
        <Section key={id} id={id} />
      ))}
    </article>
  );
}
