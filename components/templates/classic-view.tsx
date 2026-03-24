'use client';

import { Mail, Globe, Github, Linkedin, Twitter, Star } from 'lucide-react';
import { displayUrl, formatRange } from '@/lib/profile-format';
import type { ProfileContent, SectionId } from '@/lib/types';
import { DEFAULT_SECTIONS_ORDER, SECTION_IDS } from '@/lib/types';

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

export function ClassicView({ profile, sectionsVisibility, testimonials }: ClassicViewProps) {
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
        <div className="mb-8">
          <div className="grid grid-cols-[1fr_140px] gap-8">
            <div>
              <h1 className="text-4xl font-serif text-foreground mb-1">
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
            {hasContact && (
              <div className="text-right space-y-1 text-sm">
                {profile.email && (
                  <div className="text-muted-foreground">{profile.email}</div>
                )}
                {profile.website && (
                  <div className="text-muted-foreground">
                    {displayUrl(profile.website)}
                  </div>
                )}
                {profile.github && (
                  <div className="text-muted-foreground">
                    github.com/{profile.github}
                  </div>
                )}
                {profile.linkedin && (
                  <div className="text-muted-foreground">
                    linkedin.com/in/{profile.linkedin}
                  </div>
                )}
                {profile.twitter && (
                  <div className="text-muted-foreground">
                    @{profile.twitter}
                  </div>
                )}
              </div>
            )}
          </div>
          {profile.bio && (
            <p className="mt-4 text-foreground leading-relaxed whitespace-pre-line text-sm">
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
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Experience
          </h2>
          <div className="space-y-4">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="grid grid-cols-[100px_1fr] gap-4">
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
              <div key={edu.id} className="grid grid-cols-[100px_1fr] gap-4">
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

    if (id === 'projects') {
      if (!Array.isArray(profile.projects) || profile.projects.length === 0)
        return null;
      return (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
            Projects
          </h2>
          <div className="space-y-3">
            {profile.projects.map((proj) => (
              <div key={proj.id}>
                <div className="font-medium text-foreground">
                  {proj.title}
                  {proj.year && (
                    <span className="text-muted-foreground font-normal">
                      {' '}
                      — {proj.year}
                    </span>
                  )}
                </div>
                {proj.company && (
                  <div className="text-sm text-muted-foreground">
                    {proj.company}
                  </div>
                )}
                {proj.description && (
                  <p className="mt-1 text-sm text-foreground/80">
                    {proj.description}
                  </p>
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
              <div key={vol.id} className="grid grid-cols-[100px_1fr] gap-4">
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
            {testimonials.map((t) => (
              <div key={t._id} className="border-l-2 border-primary/30 pl-4">
                <p className="text-sm text-foreground italic leading-relaxed">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{t.authorName}</span>
                  {t.authorTitle && (
                    <>, {t.authorTitle}</>
                  )}
                  {t.authorCompany && (
                    <>, {t.authorCompany}</>
                  )}
                  {' \u00b7 '}
                  <span>{t.relationship}</span>
                </div>
                {t.rating && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < t.rating! ? 'text-primary fill-primary' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-card p-8">
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
