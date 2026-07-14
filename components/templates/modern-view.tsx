import { Star } from 'lucide-react';
import { displayUrl, formatRange } from '@/lib/profile-format';
import type { ProfileContent, SectionId } from '@/lib/types';
import {
  hasContactContent,
  resolveVisibleSections,
} from '@/lib/profile/rendering';
import { ProjectsSection } from '@/components/profile/sections/ProjectsSection';

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

  const Section = ({ id }: { id: SectionId }) => {
    if (id === 'header') {
      return (
        <div className="mb-10">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-foreground mb-2">
              {profile.name}
            </h1>
            {profile.title && (
              <p className="text-xl text-primary font-medium">
                {profile.title}
              </p>
            )}
            {profile.location && (
              <p className="text-muted-foreground mt-1">{profile.location}</p>
            )}
          </div>
        </div>
      );
    }

    if (id === 'contact') {
      if (!hasContact) return null;
      return (
        <div className="mb-8 flex flex-wrap justify-center gap-4 break-words text-sm text-muted-foreground">
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
        <p className="mb-8 text-center text-foreground/80 max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
          {profile.bio}
        </p>
      ) : null;
    }

    if (id === 'experience') {
      if (!Array.isArray(profile.experience) || profile.experience.length === 0)
        return null;
      return (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Experience
          </h2>
          <div className="space-y-5">
            {profile.experience.map((exp) => (
              <div
                key={exp.id}
                className="bg-muted/30 rounded-lg p-4 border border-border/50"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {exp.role}
                    </h3>
                    <p className="text-muted-foreground">{exp.company}</p>
                  </div>
                  <span className="text-sm text-primary font-medium">
                    {formatRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-sm text-foreground/80 whitespace-pre-line mt-2">
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
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Education
          </h2>
          <div className="space-y-4">
            {profile.education.map((edu) => (
              <div
                key={edu.id}
                className="bg-muted/30 rounded-lg p-4 border border-border/50"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {edu.degree}
                    </h3>
                    <p className="text-muted-foreground">{edu.school}</p>
                  </div>
                  <span className="text-sm text-primary font-medium">
                    {formatRange(edu.startDate, edu.endDate, edu.current)}
                  </span>
                </div>
                {edu.description && (
                  <p className="text-sm text-foreground/80 mt-2">
                    {edu.description}
                  </p>
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
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (id === 'projects') {
      return <ProjectsSection profile={profile} variant="modern" />;
    }

    if (id === 'certifications') {
      if (
        !Array.isArray(profile.certifications) ||
        profile.certifications.length === 0
      )
        return null;
      return (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
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
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Volunteering
          </h2>
          <div className="space-y-4">
            {profile.volunteering.map((vol) => (
              <div
                key={vol.id}
                className="bg-muted/30 rounded-lg p-4 border border-border/50"
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
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Exhibitions
          </h2>
          <div className="space-y-2">
            {profile.exhibitions.map((exh) => (
              <div
                key={exh.id}
                className="flex flex-col gap-1 py-2 border-b border-border/30 last:border-0 sm:flex-row sm:justify-between sm:items-center"
              >
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
            ))}
          </div>
        </div>
      );
    }

    if (id === 'awards') {
      if (!Array.isArray(profile.awards) || profile.awards.length === 0)
        return null;
      return (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Awards
          </h2>
          <div className="space-y-2">
            {profile.awards.map((award) => (
              <div
                key={award.id}
                className="flex flex-col gap-1 py-2 border-b border-border/30 last:border-0 sm:flex-row sm:justify-between sm:items-center"
              >
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
            ))}
          </div>
        </div>
      );
    }

    if (id === 'testimonials') {
      if (!testimonials || testimonials.length === 0) return null;
      return (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Testimonials
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {testimonials.map((t) => {
              const rating = t.rating;
              return (
                <div
                  key={t._id}
                  className="bg-muted/30 rounded-lg p-4 border border-border/50"
                >
                  <p className="text-sm text-foreground/80 italic leading-relaxed">
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
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-card p-6 sm:p-8">
      {visibleSections.map((id) => (
        <Section key={id} id={id} />
      ))}
    </div>
  );
}
