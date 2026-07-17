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
        <div className="mb-16 min-w-0">
          <ProfileAvatar
            src={profile.avatar}
            name={profile.name}
            className="mb-6 rounded-[2px]"
          />
          <h1 className="mb-4 min-w-0 break-words text-4xl font-light tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-6xl">
            {profile.name}
          </h1>
          {profile.title && (
            <p className="text-2xl text-muted-foreground font-light mb-2">
              {profile.title}
            </p>
          )}
          {profile.location && (
            <p className="text-muted-foreground">{profile.location}</p>
          )}
        </div>
      );
    }

    if (id === 'contact') {
      if (!hasContact) return null;
      return (
        <div className="mb-12 flex flex-wrap gap-6 break-words text-sm text-muted-foreground">
          {[
            profile.email,
            profile.website && displayUrl(profile.website),
            profile.github && `github.com/${profile.github}`,
            profile.linkedin && `linkedin.com/in/${profile.linkedin}`,
            profile.twitter && `@${profile.twitter}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      );
    }

    if (id === 'bio') {
      return profile.bio ? (
        <p className="mb-12 text-foreground/70 leading-relaxed whitespace-pre-line max-w-2xl">
          {profile.bio}
        </p>
      ) : null;
    }

    if (id === 'experience') {
      if (!Array.isArray(profile.experience) || profile.experience.length === 0)
        return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Experience
          </h2>
          <div className="space-y-8">
            {profile.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-col gap-1 mb-1 sm:flex-row sm:justify-between sm:items-baseline">
                  <h3 className="text-lg font-medium text-foreground">
                    {exp.role}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {formatRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                <p className="text-muted-foreground">{exp.company}</p>
                {exp.description && (
                  <p className="mt-3 text-foreground/60 whitespace-pre-line leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (id === 'education') {
      if (!Array.isArray(profile.education) || profile.education.length === 0)
        return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Education
          </h2>
          <div className="space-y-6">
            {profile.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex flex-col gap-1 mb-1 sm:flex-row sm:justify-between sm:items-baseline">
                  <h3 className="text-lg font-medium text-foreground">
                    {edu.degree}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {formatRange(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                <p className="text-muted-foreground">{edu.school}</p>
                {edu.description && (
                  <p className="mt-2 text-foreground/60">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (id === 'skills') {
      if (!Array.isArray(profile.skills) || profile.skills.length === 0)
        return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
            Skills
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {profile.skills.join(' / ')}
          </p>
        </div>
      );
    }

    if (id === 'languages' || id === 'publications' || id === 'interests') {
      return (
        <AdditionalProfileSection
          id={id}
          profile={profile}
          className="mb-12"
          headingClassName="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground"
        />
      );
    }

    if (id === 'projects') {
      return <ProjectsSection profile={profile} variant="minimal" />;
    }

    if (id === 'certifications') {
      if (
        !Array.isArray(profile.certifications) ||
        profile.certifications.length === 0
      )
        return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
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
        </div>
      );
    }

    if (id === 'volunteering') {
      if (
        !Array.isArray(profile.volunteering) ||
        profile.volunteering.length === 0
      )
        return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Volunteering
          </h2>
          <div className="space-y-6">
            {profile.volunteering.map((vol) => (
              <div key={vol.id}>
                <div className="flex flex-col gap-1 mb-1 sm:flex-row sm:justify-between sm:items-baseline">
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
        </div>
      );
    }

    if (id === 'exhibitions') {
      if (
        !Array.isArray(profile.exhibitions) ||
        profile.exhibitions.length === 0
      )
        return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
            Exhibitions
          </h2>
          <div className="space-y-3">
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
        </div>
      );
    }

    if (id === 'awards') {
      if (!Array.isArray(profile.awards) || profile.awards.length === 0)
        return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
            Awards
          </h2>
          <div className="space-y-3">
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
        </div>
      );
    }

    if (id === 'testimonials') {
      if (!testimonials || testimonials.length === 0) return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Testimonials
          </h2>
          <div className="space-y-6">
            {testimonials.map((t) => (
              <div key={t._id}>
                <p className="text-foreground/60 italic leading-relaxed">
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
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full min-w-0 overflow-hidden bg-card p-6 sm:p-12">
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      {visibleSections.map((id) => (
        <Section key={id} id={id} />
      ))}
    </div>
  );
}
