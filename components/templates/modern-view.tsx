import { Star } from 'lucide-react';
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

type ModernViewProps = {
  profile: ProfileContent;
  sectionsVisibility?: Record<string, boolean>;
  testimonials?: Testimonial[];
};

export function ModernView({
  profile,
  sectionsVisibility,
  testimonials,
}: ModernViewProps) {
  const visibleSections = resolveVisibleSections(profile, {
    sectionsVisibility,
    testimonialCount: testimonials?.length,
  });
  const hasContact = hasContactContent(profile);
  const headerVisible = visibleSections.includes('header');

  const Section = ({ id }: { id: SectionId }) => {
    if (id === 'header') {
      return (
        <header className="mb-10 rounded-[28px] bg-secondary/80 p-6 sm:mb-12 lg:sticky lg:top-6 lg:col-start-1 lg:row-start-1 lg:row-span-[99] lg:self-start">
          <div className="grid min-w-0 gap-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:grid-cols-1">
            <div className="min-w-0">
              <h1 className="min-w-0 break-words text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground [overflow-wrap:anywhere] sm:text-5xl">
                {profile.name}
              </h1>
              {profile.title && (
                <p className="mt-4 max-w-2xl text-xl leading-snug text-primary sm:text-2xl">
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
              className="sm:h-28 sm:w-28"
            />
          </div>
        </header>
      );
    }

    if (id === 'contact') {
      if (!hasContact) return null;
      return (
        <address className="mb-10 break-words rounded-2xl bg-muted/55 p-5 text-sm leading-7 text-muted-foreground not-italic [overflow-wrap:anywhere]">
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
        <p className="mb-12 max-w-2xl whitespace-pre-line text-lg leading-8 text-foreground/80">
          {profile.bio}
        </p>
      ) : null;
    }

    if (id === 'experience') {
      if (!Array.isArray(profile.experience) || profile.experience.length === 0)
        return null;
      return (
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            Experience
          </h2>
          <div className="space-y-3">
            {profile.experience.map((exp) => (
              <div
                key={exp.id}
                className="grid gap-3 rounded-2xl bg-muted/50 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8"
              >
                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-foreground">
                    {exp.role}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {exp.company}
                  </p>
                  {exp.description && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground/75">
                      {exp.description}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground sm:text-right">
                  {formatRange(exp.startDate, exp.endDate, exp.current)}
                </span>
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
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            Education
          </h2>
          <div className="space-y-3">
            {profile.education.map((edu) => (
              <div
                key={edu.id}
                className="grid gap-3 rounded-2xl bg-muted/50 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8"
              >
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground">{edu.degree}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {edu.school}
                  </p>
                  {edu.description && (
                    <p className="mt-3 text-sm leading-6 text-foreground/75">
                      {edu.description}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground sm:text-right">
                  {formatRange(edu.startDate, edu.endDate, edu.current)}
                </span>
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
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Skills</h2>
          <ul className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-secondary px-3 py-2 text-sm font-medium text-foreground"
              >
                {skill}
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
          className="mb-12 [&_ol]:space-y-2 [&_ol]:border-0 [&_ol]:divide-y-0 [&_li]:rounded-xl [&_li]:bg-muted/45 [&_li]:p-4"
          headingClassName="mb-6 text-lg font-semibold text-foreground"
        />
      );
    }

    if (id === 'projects') {
      return (
        <section className="mb-12 rounded-[28px] bg-primary/8 p-5 sm:p-7 [&>div]:mb-0">
          <ProjectsSection profile={profile} variant="modern" />
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
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            Certifications
          </h2>
          <div className="space-y-2">
            {profile.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex flex-col gap-1 py-2 border-b border-border/30 last:border-0 sm:flex-row sm:justify-between sm:items-center"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {cert.name}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    — {cert.issuer}
                  </span>
                </div>
                {cert.year && (
                  <span className="text-sm text-primary">{cert.year}</span>
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
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            Volunteering
          </h2>
          <div className="space-y-4">
            {profile.volunteering.map((vol) => (
              <div
                key={vol.id}
                className="border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {vol.role}
                    </h3>
                    <p className="text-muted-foreground">{vol.organization}</p>
                  </div>
                  <span className="text-sm text-primary font-medium">
                    {formatRange(vol.startDate, vol.endDate, vol.current)}
                  </span>
                </div>
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
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            Exhibitions
          </h2>
          <div className="space-y-6">
            {profile.exhibitions.map((exh) => (
              <div
                key={exh.id}
                className="border-b border-border pb-5 last:border-0 last:pb-0"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <span className="font-medium text-foreground">
                      {exh.title}
                    </span>
                    {exh.venue && (
                      <span className="text-muted-foreground">
                        {' '}
                        — {exh.venue}
                      </span>
                    )}
                  </div>
                  {exh.year && (
                    <span className="text-sm text-primary">{exh.year}</span>
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
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Awards</h2>
          <div className="space-y-6">
            {profile.awards.map((award) => (
              <div
                key={award.id}
                className="border-b border-border pb-5 last:border-0 last:pb-0"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <span className="font-medium text-foreground">
                      {award.title}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}
                      — {award.issuer}
                    </span>
                  </div>
                  {award.year && (
                    <span className="text-sm text-primary">{award.year}</span>
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
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            Testimonials
          </h2>
          <div className="space-y-7">
            {testimonials.map((t) => {
              const rating = t.rating;
              return (
                <div key={t._id} className="rounded-2xl bg-secondary/60 p-5">
                  <p className="text-lg italic leading-8 text-foreground/80">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t.authorName}
                    </span>
                    {t.authorTitle && <>, {t.authorTitle}</>}
                    {t.authorCompany && <>, {t.authorCompany}</>}
                  </div>
                  {rating && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < rating ? 'text-primary fill-primary' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <article
      className={`mx-auto w-full max-w-[1120px] min-w-0 overflow-hidden rounded-[32px] bg-card px-5 py-8 shadow-sm sm:px-10 sm:py-12 ${
        headerVisible
          ? 'lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-x-10 lg:[&>address]:col-start-2 lg:[&>p]:col-start-2 lg:[&>section]:col-start-2'
          : ''
      }`}
    >
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      {visibleSections.map((id) => (
        <Section key={id} id={id} />
      ))}
    </article>
  );
}
