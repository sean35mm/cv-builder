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

type ClassicViewProps = {
  profile: ProfileContent;
  sectionsVisibility?: Record<string, boolean>;
  testimonials?: Testimonial[];
};

export function ClassicView({
  profile,
  sectionsVisibility,
  testimonials,
}: ClassicViewProps) {
  const visibleSections = resolveVisibleSections(profile, {
    sectionsVisibility,
    testimonialCount: testimonials?.length,
  });
  const hasContact = hasContactContent(profile);
  const headerVisible = visibleSections.includes('header');

  const Section = ({ id }: { id: SectionId }) => {
    if (id === 'header') {
      return (
        <header className="mb-10 rounded-[28px] bg-secondary/70 p-6 sm:mb-12 sm:p-8">
          <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.6fr)] sm:items-end">
            <div className="min-w-0">
              <h1 className="min-w-0 break-words font-serif text-4xl leading-[1.05] tracking-[-0.025em] text-foreground [overflow-wrap:anywhere] sm:text-5xl">
                {profile.name}
              </h1>
            </div>
            <div className="flex min-w-0 items-end justify-between gap-4 sm:flex-col sm:items-start">
              <div>
                {profile.title && (
                  <p className="max-w-xl text-lg leading-snug text-foreground/80 sm:text-xl">
                    {profile.title}
                  </p>
                )}
                {profile.location && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {profile.location}
                  </p>
                )}
              </div>
              <ProfileAvatar src={profile.avatar} name={profile.name} />
            </div>
          </div>
        </header>
      );
    }

    if (id === 'contact') {
      if (!hasContact) return null;
      return (
        <address className="mb-10 rounded-2xl bg-muted/60 px-5 py-4 text-sm leading-6 text-muted-foreground not-italic [overflow-wrap:anywhere]">
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
        <p className="mb-12 max-w-2xl whitespace-pre-line font-serif text-lg leading-8 text-foreground/85 sm:text-xl">
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
                className="grid grid-cols-1 gap-2 rounded-2xl bg-muted/50 p-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6"
              >
                <div className="pt-1 text-xs leading-5 text-muted-foreground">
                  {formatRange(exp.startDate, exp.endDate, exp.current)}
                </div>
                <div>
                  <h3 className="font-serif text-lg text-foreground">
                    {exp.role}
                  </h3>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {exp.company}
                  </div>
                  {exp.description && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground/75">
                      {exp.description}
                    </p>
                  )}
                </div>
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
                className="grid grid-cols-1 gap-2 rounded-2xl bg-muted/50 p-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6"
              >
                <div className="pt-1 text-xs leading-5 text-muted-foreground">
                  {formatRange(edu.startDate, edu.endDate, edu.current)}
                </div>
                <div>
                  <h3 className="font-serif text-lg text-foreground">
                    {edu.degree}
                  </h3>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {edu.school}
                  </div>
                  {edu.description && (
                    <p className="mt-3 text-sm leading-6 text-foreground/75">
                      {edu.description}
                    </p>
                  )}
                </div>
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
          <p className="rounded-2xl bg-secondary/60 p-5 text-sm leading-7 text-foreground/80">
            {profile.skills.join(' • ')}
          </p>
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
          <ProjectsSection profile={profile} variant="classic" />
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
              <div key={cert.id}>
                <span className="font-medium text-foreground">{cert.name}</span>
                <span className="text-muted-foreground"> — {cert.issuer}</span>
                {cert.year && (
                  <span className="text-muted-foreground"> ({cert.year})</span>
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
          <div className="space-y-3">
            {profile.volunteering.map((vol) => (
              <div
                key={vol.id}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6"
              >
                <div className="text-xs text-muted-foreground pt-0.5">
                  {formatRange(vol.startDate, vol.endDate, vol.current)}
                </div>
                <div>
                  <div className="font-medium text-foreground">{vol.role}</div>
                  <div className="text-sm text-muted-foreground">
                    {vol.organization}
                  </div>
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
          <div className="space-y-5">
            {profile.exhibitions.map((exh) => (
              <div key={exh.id}>
                <span className="font-medium text-foreground">{exh.title}</span>
                {exh.venue && (
                  <span className="text-muted-foreground"> — {exh.venue}</span>
                )}
                {exh.year && (
                  <span className="text-muted-foreground"> ({exh.year})</span>
                )}
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
          <div className="space-y-5">
            {profile.awards.map((award) => (
              <div key={award.id}>
                <span className="font-medium text-foreground">
                  {award.title}
                </span>
                <span className="text-muted-foreground"> — {award.issuer}</span>
                {award.year && (
                  <span className="text-muted-foreground"> ({award.year})</span>
                )}
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
          <div className="space-y-6">
            {testimonials.map((t) => {
              const rating = t.rating;
              return (
                <blockquote
                  key={t._id}
                  className="rounded-2xl bg-secondary/55 p-5"
                >
                  <p className="font-serif text-lg italic leading-7 text-foreground/85">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t.authorName}
                    </span>
                    {t.authorTitle && <>, {t.authorTitle}</>}
                    {t.authorCompany && <>, {t.authorCompany}</>}
                    {' \u00b7 '}
                    <span>{t.relationship}</span>
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
                </blockquote>
              );
            })}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <article className="mx-auto w-full max-w-[920px] min-w-0 overflow-hidden rounded-[32px] bg-card px-5 py-8 shadow-sm sm:px-10 sm:py-12">
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      {visibleSections.map((id) => (
        <Section key={id} id={id} />
      ))}
    </article>
  );
}
