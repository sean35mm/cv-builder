'use client';

import { Mail, Globe, Github, Linkedin, Twitter, Star } from 'lucide-react';
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

type ModernViewProps = {
  profile: ProfileContent;
  sectionsVisibility?: Record<string, boolean>;
  testimonials?: Testimonial[];
};

export function ModernView({ profile, sectionsVisibility, testimonials }: ModernViewProps) {
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

          {hasContact && (
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </a>
              )}
              {profile.website && (
                <a
                  href={
                    profile.website.startsWith('http')
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {displayUrl(profile.website)}
                </a>
              )}
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-4 h-4" />
                  {profile.github}
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={`https://linkedin.com/in/${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  {profile.linkedin}
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="w-4 h-4" />@{profile.twitter}
                </a>
              )}
            </div>
          )}

          {profile.bio && (
            <p className="mt-6 text-center text-foreground/80 max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
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
                <div className="flex justify-between items-start mb-2">
                  <div>
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
                <div className="flex justify-between items-start">
                  <div>
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
      if (!Array.isArray(profile.projects) || profile.projects.length === 0)
        return null;
      return (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Projects
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-muted/30 rounded-lg p-4 border border-border/50"
              >
                <h3 className="font-semibold text-foreground">{proj.title}</h3>
                {proj.year && (
                  <span className="text-sm text-primary">{proj.year}</span>
                )}
                {proj.company && (
                  <p className="text-sm text-muted-foreground">
                    {proj.company}
                  </p>
                )}
                {proj.description && (
                  <p className="text-sm text-foreground/80 mt-2">
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
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-primary rounded-full" />
            Certifications
          </h2>
          <div className="space-y-2">
            {profile.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
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
                <div className="flex justify-between items-start">
                  <div>
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
                className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
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
                className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
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
            {testimonials.map((t) => (
              <div
                key={t._id}
                className="bg-muted/30 rounded-lg p-4 border border-border/50"
              >
                <p className="text-sm text-foreground/80 italic leading-relaxed">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{t.authorName}</span>
                  {t.authorTitle && (
                    <>, {t.authorTitle}</>
                  )}
                  {t.authorCompany && (
                    <>, {t.authorCompany}</>
                  )}
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
