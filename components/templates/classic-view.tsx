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
        <div className="mb-8">
          <div className="flex min-w-0 items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="mb-1 min-w-0 break-words font-serif text-4xl text-foreground [overflow-wrap:anywhere]">
                {profile.name}
              </h1>
              {profile.title && (
                <p className="text-lg text-muted-foreground mb-1">
                  {profile.title}
                </p>
              )}
              {profile.location && (
                <p className="text-sm text-muted-foreground">
                  {profile.location}
                </p>
              )}
            </div>
            <ProfileAvatar src={profile.avatar} name={profile.name} />
          </div>
        </div>
      );
    }

    if (id === 'contact') {
      if (!hasContact) return null;
      return (
        <div className="mb-6 break-words text-sm text-muted-foreground">
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
        <p className="mb-6 text-foreground leading-relaxed whitespace-pre-line text-sm">
          {profile.bio}
        </p>
      ) : null;
    }

    if (id === 'experience') {
      if (!Array.isArray(profile.experience) || profile.experience.length === 0)
        return null;
      return (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Experience
          </h2>
          <div className="space-y-4">
            {profile.experience.map((exp) => (
              <div
                key={exp.id}
                className="grid grid-cols-1 gap-1 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-4"
              >
                <div className="text-xs text-muted-foreground pt-0.5">
                  {formatRange(exp.startDate, exp.endDate, exp.current)}
                </div>
                <div>
                  <div className="font-medium text-foreground">{exp.role}</div>
                  <div className="text-sm text-muted-foreground">
                    {exp.company}
                  </div>
                  {exp.description && (
                    <p className="mt-1 text-sm text-foreground/80 whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </div>
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
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Education
          </h2>
          <div className="space-y-4">
            {profile.education.map((edu) => (
              <div
                key={edu.id}
                className="grid grid-cols-1 gap-1 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-4"
              >
                <div className="text-xs text-muted-foreground pt-0.5">
                  {formatRange(edu.startDate, edu.endDate, edu.current)}
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {edu.degree}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {edu.school}
                  </div>
                  {edu.description && (
                    <p className="mt-1 text-sm text-foreground/80">
                      {edu.description}
                    </p>
                  )}
                </div>
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
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Skills
          </h2>
          <p className="text-sm text-foreground">
            {profile.skills.join(' • ')}
          </p>
        </div>
      );
    }

    if (id === 'languages' || id === 'publications' || id === 'interests') {
      return (
        <AdditionalProfileSection
          id={id}
          profile={profile}
          className="mb-6"
          headingClassName="mb-4 border-b pb-1 text-sm font-bold uppercase tracking-wide text-foreground"
        />
      );
    }

    if (id === 'projects') {
      return <ProjectsSection profile={profile} variant="classic" />;
    }

    if (id === 'certifications') {
      if (
        !Array.isArray(profile.certifications) ||
        profile.certifications.length === 0
      )
        return null;
      return (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
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
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Volunteering
          </h2>
          <div className="space-y-3">
            {profile.volunteering.map((vol) => (
              <div
                key={vol.id}
                className="grid grid-cols-1 gap-1 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-4"
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
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Exhibitions
          </h2>
          <div className="space-y-2">
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
        </div>
      );
    }

    if (id === 'awards') {
      if (!Array.isArray(profile.awards) || profile.awards.length === 0)
        return null;
      return (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Awards
          </h2>
          <div className="space-y-2">
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
        </div>
      );
    }

    if (id === 'testimonials') {
      if (!testimonials || testimonials.length === 0) return null;
      return (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Testimonials
          </h2>
          <div className="space-y-4">
            {testimonials.map((t) => {
              const rating = t.rating;
              return (
                <div key={t._id} className="border-l-2 border-primary/30 pl-4">
                  <p className="text-sm text-foreground italic leading-relaxed">
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
    <div className="w-full min-w-0 overflow-hidden bg-card p-6 sm:p-8">
      {!headerVisible && <h1 className="sr-only">{profile.username}</h1>}
      {visibleSections.map((id) => (
        <Section key={id} id={id} />
      ))}
    </div>
  );
}
