'use client';

import { Separator } from '@/components/ui/separator';
import type { ProfilePreviewProps, SectionId } from '@/lib/types';
import {
  displayUrl,
  formatRange,
  normalizeExternalUrl,
} from '@/lib/profile-format';
import {
  hasContactContent,
  resolveCompleteSectionOrder,
  resolveVisibleSections,
} from '@/lib/profile/rendering';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Globe, Linkedin, Mail, Twitter } from 'lucide-react';
import { ProjectsSection } from '@/components/profile/sections/ProjectsSection';
import { AdditionalProfileSection } from '@/components/profile/sections/additional-profile-section';
import { ProfileTypography } from '@/components/profile/profile-typography';
import {
  EntryMediaGrid,
  ProfileAvatar,
} from '@/components/profile/profile-media';

export function ProfilePreview({
  profile,
  sectionsOrder,
  sectionsVisibility,
  headingFont,
  bodyFont,
  colorTheme = 'sage',
}: ProfilePreviewProps & { colorTheme?: string }) {
  const requestedOrder = sectionsOrder ?? profile.sectionsOrder;
  const order = resolveCompleteSectionOrder(requestedOrder);
  const visibleSections = new Set(
    resolveVisibleSections(profile, {
      sectionsOrder: requestedOrder,
      sectionsVisibility,
    })
  );
  const hasContact = hasContactContent(profile);

  const Section = ({ id }: { id: SectionId }) => {
    if (id === 'header') {
      return (
        <div className="mb-8 relative group">
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1">
              <h1 className="text-5xl font-serif text-foreground mb-2">
                {profile.name}
              </h1>
              {profile.title && (
                <p className="text-lg text-muted-foreground mb-2">
                  {profile.title}
                </p>
              )}
              {profile.location && (
                <p className="text-muted-foreground mb-2">{profile.location}</p>
              )}
            </div>
            <ProfileAvatar src={profile.avatar} name={profile.name} />
          </div>
        </div>
      );
    }

    if (id === 'bio') {
      return profile.bio ? (
        <p className="mb-8 text-foreground leading-relaxed whitespace-pre-line">
          {profile.bio}
        </p>
      ) : null;
    }

    if (id === 'contact') {
      if (!hasContact) return null;
      const websiteUrl = normalizeExternalUrl(profile.website);
      return (
        <div className="mb-8 space-y-2">
          {profile.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a
                href={`mailto:${profile.email}`}
                className="text-sm text-primary"
              >
                {profile.email}
              </a>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary"
                >
                  {displayUrl(profile.website)}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {profile.website}
                </span>
              )}
            </div>
          )}
          {profile.github && (
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{profile.github}</span>
            </div>
          )}
          {profile.linkedin && (
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{profile.linkedin}</span>
            </div>
          )}
          {profile.twitter && (
            <div className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">@{profile.twitter}</span>
            </div>
          )}
        </div>
      );
    }

    if (id === 'experience') {
      return (
        Array.isArray(profile.experience) &&
        profile.experience.length > 0 && (
          <div className="mb-8 relative group">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Experience
            </h2>
            <div className="space-y-6">
              {profile.experience.map((exp) => (
                <div
                  key={`exp:${exp.id}`}
                  className="grid grid-cols-1 gap-y-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-x-8"
                >
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatRange(exp.startDate, exp.endDate, exp.current)}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{exp.role}</h3>
                    <p className="text-muted-foreground mb-2 text-sm">
                      {exp.company}
                    </p>
                    {exp.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'education') {
      return (
        Array.isArray(profile.education) &&
        profile.education.length > 0 && (
          <div className="mb-8 relative group">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Education
            </h2>
            <div className="space-y-6">
              {profile.education.map((edu) => (
                <div
                  key={`edu:${edu.id}`}
                  className="grid grid-cols-1 gap-y-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-x-8"
                >
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatRange(edu.startDate, edu.endDate, edu.current)}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {edu.degree}
                    </h3>
                    <p className="text-muted-foreground mb-2">{edu.school}</p>
                    {edu.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'skills') {
      return (
        Array.isArray(profile.skills) &&
        profile.skills.length > 0 && (
          <div className="mb-8 relative group">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
                <span
                  key={`skill:${skill}`}
                  className="bg-muted text-foreground px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'languages' || id === 'publications' || id === 'interests') {
      return <AdditionalProfileSection id={id} profile={profile} />;
    }
    if (id === 'projects') {
      return <ProjectsSection profile={profile} variant="modern" />;
    }
    if (id === 'certifications') {
      const certificationUrls = new Map(
        (Array.isArray(profile.certifications)
          ? profile.certifications
          : []
        ).map((certification) => [
          certification.id,
          normalizeExternalUrl(certification.link),
        ])
      );
      return (
        Array.isArray(profile.certifications) &&
        profile.certifications.length > 0 && (
          <div className="mb-8 relative group">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Certifications
            </h2>
            <div className="space-y-6">
              {profile.certifications.map((c) => (
                <div key={`cert:${c.id}`}>
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-medium text-foreground">{c.name}</h3>
                    {c.year && (
                      <span className="text-sm text-muted-foreground">
                        {c.year}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-1">{c.issuer}</p>
                  {certificationUrls.get(c.id) ? (
                    <a
                      href={certificationUrls.get(c.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/70"
                    >
                      {displayUrl(c.link)}
                    </a>
                  ) : c.link ? (
                    <span className="text-sm text-muted-foreground">
                      {c.link}
                    </span>
                  ) : null}
                  {c.credentialId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Credential ID: {c.credentialId}
                    </p>
                  )}
                  {c.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mt-1">
                      {c.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'volunteering') {
      return (
        Array.isArray(profile.volunteering) &&
        profile.volunteering.length > 0 && (
          <div className="mb-8 relative group">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Volunteering
            </h2>
            <div className="space-y-6">
              {profile.volunteering.map((v) => (
                <div
                  key={`vol:${v.id}`}
                  className="grid grid-cols-1 gap-y-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-x-8"
                >
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatRange(v.startDate, v.endDate, v.current)}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{v.role}</h3>
                    <p className="text-muted-foreground mb-2">
                      {v.organization}
                    </p>
                    {v.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                        {v.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'exhibitions') {
      const exhibitionUrls = new Map(
        (Array.isArray(profile.exhibitions) ? profile.exhibitions : []).map(
          (exhibition) => [exhibition.id, normalizeExternalUrl(exhibition.link)]
        )
      );
      return (
        Array.isArray(profile.exhibitions) &&
        profile.exhibitions.length > 0 && (
          <div className="mb-8 relative group">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Exhibitions
            </h2>
            <div className="space-y-6">
              {profile.exhibitions.map((e) => (
                <div key={`exh:${e.id}`}>
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-medium text-foreground">{e.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {e.year}
                    </span>
                  </div>
                  {(e.venue || e.location) && (
                    <p className="text-muted-foreground mb-1">
                      {[e.venue, e.location].filter(Boolean).join(' — ')}
                    </p>
                  )}
                  {exhibitionUrls.get(e.id) ? (
                    <a
                      href={exhibitionUrls.get(e.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/70"
                    >
                      {displayUrl(e.link)}
                    </a>
                  ) : e.link ? (
                    <span className="text-sm text-muted-foreground">
                      {e.link}
                    </span>
                  ) : null}
                  {e.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mt-1">
                      {e.description}
                    </p>
                  )}
                  <EntryMediaGrid images={e.images} title={e.title} />
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'awards') {
      const awardUrls = new Map(
        (Array.isArray(profile.awards) ? profile.awards : []).map((award) => [
          award.id,
          normalizeExternalUrl(award.link),
        ])
      );
      return (
        Array.isArray(profile.awards) &&
        profile.awards.length > 0 && (
          <div className="mb-8 relative group">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Awards
            </h2>
            <div className="space-y-6">
              {profile.awards.map((a) => (
                <div key={`awd:${a.id}`}>
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-medium text-foreground">{a.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {a.year}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-1">{a.issuer}</p>
                  {awardUrls.get(a.id) ? (
                    <a
                      href={awardUrls.get(a.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/70"
                    >
                      {displayUrl(a.link)}
                    </a>
                  ) : a.link ? (
                    <span className="text-sm text-muted-foreground">
                      {a.link}
                    </span>
                  ) : null}
                  {a.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mt-1">
                      {a.description}
                    </p>
                  )}
                  <EntryMediaGrid images={a.images} title={a.title} />
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'testimonials') return null;
    const exhaustiveSection: never = id;
    return exhaustiveSection;
  };

  return (
    <div
      className={`profile-theme theme-${colorTheme} w-full`}
      data-profile-theme={colorTheme}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="w-full border bg-card p-8">
          <ProfileTypography headingFont={headingFont} bodyFont={bodyFont}>
            <AnimatePresence initial={false}>
              {order.map((id, idx) => {
                const visible = visibleSections.has(id);
                const hasNextVisible =
                  visible &&
                  order
                    .slice(idx + 1)
                    .some((section) => visibleSections.has(section));
                return (
                  <motion.div
                    key={`section:${id}`}
                    layout
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  >
                    {visible && <Section id={id} />}
                    {visible && hasNextVisible && (
                      <Separator className="my-6" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ProfileTypography>
        </div>
      </div>
    </div>
  );
}
