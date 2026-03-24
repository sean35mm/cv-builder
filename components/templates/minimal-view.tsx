'use client';

import { displayUrl, formatRange } from '@/lib/profile-format';
import type { ProfileContent, SectionId } from '@/lib/types';
import { DEFAULT_SECTIONS_ORDER, SECTION_IDS } from '@/lib/types';

const sanitizeSectionsOrder = (order?: ReadonlyArray<string>): SectionId[] => {
  const result: SectionId[] = [];
  if (order) {
    for (const candidate of order) {
      const section = candidate as SectionId;
      if (SECTION_IDS.includes(section) && !result.includes(section)) {
        result.push(section);
      }
    }
  }
  for (const section of DEFAULT_SECTIONS_ORDER) {
    if (!result.includes(section)) {
      result.push(section);
    }
  }
  return result;
};

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

export function MinimalView({ profile, sectionsVisibility, testimonials }: MinimalViewProps) {
  const order = sanitizeSectionsOrder(profile.sectionsOrder);
  const filteredOrder = sectionsVisibility
    ? order.filter((s) => sectionsVisibility[s] !== false)
    : order;

  const hasContact =
    profile.email ||
    profile.website ||
    profile.github ||
    profile.linkedin ||
    profile.twitter;

  const Section = ({ id }: { id: SectionId }) => {
    if (id === 'header') {
      return (
        <div className="mb-16">
          <h1 className="text-6xl font-light text-foreground mb-4 tracking-tight">
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

          {hasContact && (
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
              {profile.email && <span>{profile.email}</span>}
              {profile.website && <span>{displayUrl(profile.website)}</span>}
              {profile.github && <span>github.com/{profile.github}</span>}
              {profile.linkedin && (
                <span>linkedin.com/in/{profile.linkedin}</span>
              )}
              {profile.twitter && <span>@{profile.twitter}</span>}
            </div>
          )}

          {profile.bio && (
            <p className="mt-8 text-foreground/70 leading-relaxed whitespace-pre-line max-w-2xl">
              {profile.bio}
            </p>
          )}
        </div>
      );
    }

    if (id === 'contact' || id === 'bio') return null;

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
                <div className="flex justify-between items-baseline mb-1">
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
                <div className="flex justify-between items-baseline mb-1">
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

    if (id === 'projects') {
      if (!Array.isArray(profile.projects) || profile.projects.length === 0)
        return null;
      return (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Projects
          </h2>
          <div className="space-y-6">
            {profile.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-lg font-medium text-foreground">
                    {proj.title}
                  </h3>
                  {proj.year && (
                    <span className="text-sm text-muted-foreground">
                      {proj.year}
                    </span>
                  )}
                </div>
                {proj.company && (
                  <p className="text-muted-foreground">{proj.company}</p>
                )}
                {proj.description && (
                  <p className="mt-2 text-foreground/60">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
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
                className="flex justify-between items-baseline"
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
                <div className="flex justify-between items-baseline mb-1">
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
              <div key={exh.id} className="flex justify-between items-baseline">
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
              <div
                key={award.id}
                className="flex justify-between items-baseline"
              >
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
                  {t.authorTitle && (
                    <>, {t.authorTitle}</>
                  )}
                  {t.authorCompany && (
                    <>, {t.authorCompany}</>
                  )}
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
    <div className="w-full bg-card p-12">
      {filteredOrder
        .filter((sid) => {
          if (sid === 'header') return true;
          if (sid === 'contact' || sid === 'bio') return false;
          if (sid === 'experience')
            return (
              Array.isArray(profile.experience) && profile.experience.length > 0
            );
          if (sid === 'education')
            return (
              Array.isArray(profile.education) && profile.education.length > 0
            );
          if (sid === 'skills')
            return Array.isArray(profile.skills) && profile.skills.length > 0;
          if (sid === 'projects')
            return (
              Array.isArray(profile.projects) && profile.projects.length > 0
            );
          if (sid === 'certifications')
            return (
              Array.isArray(profile.certifications) &&
              profile.certifications.length > 0
            );
          if (sid === 'volunteering')
            return (
              Array.isArray(profile.volunteering) &&
              profile.volunteering.length > 0
            );
          if (sid === 'exhibitions')
            return (
              Array.isArray(profile.exhibitions) &&
              profile.exhibitions.length > 0
            );
          if (sid === 'awards')
            return Array.isArray(profile.awards) && profile.awards.length > 0;
          if (sid === 'testimonials')
            return !!testimonials && testimonials.length > 0;
          return false;
        })
        .map((id) => (
          <Section key={id} id={id} />
        ))}
    </div>
  );
}
