import { Separator } from '@/components/ui/separator';
import {
  DEFAULT_SECTIONS_ORDER,
  type ProfilePreviewProps,
  type SectionId,
} from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Globe, Linkedin, Mail, Twitter } from 'lucide-react';

export function ProfilePreview({
  profile,
  sectionsOrder,
  onReorderSections: _onReorderSections,
  onReorderExperience: _onReorderExperience,
  onReorderEducation: _onReorderEducation,
  onReorderSkills: _onReorderSkills,
  showDragHandles,
}: ProfilePreviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const formatRange = (
    start: string,
    end?: string,
    current?: boolean
  ): string => {
    const startStr = formatDate(start);
    const endStr = current ? 'Now' : formatDate(end || '');
    return `${startStr} — ${endStr}`;
  };

  const displayUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    try {
      const normalized = url.startsWith('http') ? url : `https://${url}`;
      const { hostname } = new URL(normalized);
      return hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  const order: SectionId[] =
    sectionsOrder ?? profile.sectionsOrder ?? DEFAULT_SECTIONS_ORDER;

  const _sectionIds = order.map((s) => `section:${s}`);

  const DragHandle = () => null;

  const Section = ({ id }: { id: string }) => {
    if (id === 'header') {
      const hasContact =
        profile.email ||
        profile.website ||
        profile.github ||
        profile.linkedin ||
        profile.twitter;
      return (
        <div className="mb-8 relative group">
          {/* no drag handles in preview */}
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {profile.name}
              </h1>
              {profile.title && (
                <p className="text-xl text-muted-foreground mb-2">
                  {profile.title}
                </p>
              )}
              {profile.location && (
                <p className="text-muted-foreground mb-2">{profile.location}</p>
              )}
              {profile.bio && (
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              )}
            </div>
            {hasContact && (
              <div className="flex-shrink-0 space-y-2 min-w-[200px]">
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-sm text-primary hover:text-primary transition-colors"
                    >
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={
                        profile.website.startsWith('http')
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary transition-colors"
                    >
                      {displayUrl(profile.website)}
                    </a>
                  </div>
                )}
                {profile.github && (
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary transition-colors"
                    >
                      {profile.github}
                    </a>
                  </div>
                )}
                {profile.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`https://linkedin.com/in/${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary transition-colors"
                    >
                      {profile.linkedin}
                    </a>
                  </div>
                )}
                {profile.twitter && (
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`https://twitter.com/${profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary transition-colors"
                    >
                      @{profile.twitter}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Bio is rendered inside header

    if (id === 'experience') {
      return (
        Array.isArray(profile.experience) &&
        profile.experience.length > 0 && (
          <div className="mb-8 relative group">
            {showDragHandles && <DragHandle />}
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Experience
            </h2>
            <div className="space-y-6">
              {profile.experience.map((exp) => (
                <div
                  key={`exp:${exp.id}`}
                  className="grid grid-cols-[160px_1fr] gap-x-8"
                >
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatRange(exp.startDate, exp.endDate, exp.current)}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{exp.role}</h3>
                    <p className="text-muted-foreground mb-2">{exp.company}</p>
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
            {showDragHandles && <DragHandle />}
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Education
            </h2>
            <div className="space-y-6">
              {profile.education.map((edu) => (
                <div
                  key={`edu:${edu.id}`}
                  className="grid grid-cols-[160px_1fr] gap-x-8"
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
            {showDragHandles && <DragHandle />}
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
    if (id === 'projects') {
      return (
        Array.isArray(profile.projects) &&
        profile.projects.length > 0 && (
          <div className="mb-8 relative group">
            {showDragHandles && <DragHandle />}
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Projects
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.projects.map((p) => (
                <div
                  key={`proj:${p.id}`}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    {p.year && (
                      <span className="text-xs text-muted-foreground">
                        {p.year}
                      </span>
                    )}
                  </div>
                  {p.company && (
                    <p className="text-muted-foreground text-sm mb-1">
                      {p.company}
                    </p>
                  )}
                  {(p.link || undefined) && (
                    <a
                      href={
                        p.link?.startsWith('http')
                          ? p.link
                          : `https://${p.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary break-words"
                    >
                      {displayUrl(p.link)}
                    </a>
                  )}
                  {p.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                      {p.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'certifications') {
      return (
        Array.isArray(profile.certifications) &&
        profile.certifications.length > 0 && (
          <div className="mb-8 relative group">
            {showDragHandles && <DragHandle />}
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
                  {(c.link || undefined) && (
                    <a
                      href={
                        c.link?.startsWith('http')
                          ? c.link
                          : `https://${c.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary"
                    >
                      {displayUrl(c.link)}
                    </a>
                  )}
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
            {showDragHandles && <DragHandle />}
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Volunteering
            </h2>
            <div className="space-y-6">
              {profile.volunteering.map((v) => (
                <div
                  key={`vol:${v.id}`}
                  className="grid grid-cols-[160px_1fr] gap-x-8"
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
      return (
        Array.isArray(profile.exhibitions) &&
        profile.exhibitions.length > 0 && (
          <div className="mb-8 relative group">
            {showDragHandles && <DragHandle />}
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
                  {(e.link || undefined) && (
                    <a
                      href={
                        e.link?.startsWith('http')
                          ? e.link
                          : `https://${e.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary"
                    >
                      {displayUrl(e.link)}
                    </a>
                  )}
                  {e.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mt-1">
                      {e.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'awards') {
      return (
        Array.isArray(profile.awards) &&
        profile.awards.length > 0 && (
          <div className="mb-8 relative group">
            {showDragHandles && <DragHandle />}
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
                  {(a.link || undefined) && (
                    <a
                      href={
                        a.link?.startsWith('http')
                          ? a.link
                          : `https://${a.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary"
                    >
                      {displayUrl(a.link)}
                    </a>
                  )}
                  {a.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mt-1">
                      {a.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-3xl">
        <div className="w-full bg-card rounded-xl p-8 border">
          <AnimatePresence initial={false}>
            {order.map((id, idx) => {
              const isSectionVisible = (sid: SectionId) => {
                if (sid === 'header') return true;
                if (sid === 'contact') return false;
                // ignore bio as separate section
                if (sid === 'experience')
                  return (
                    Array.isArray(profile.experience) &&
                    profile.experience.length > 0
                  );
                if (sid === 'education')
                  return (
                    Array.isArray(profile.education) &&
                    profile.education.length > 0
                  );
                if (sid === 'skills')
                  return (
                    Array.isArray(profile.skills) && profile.skills.length > 0
                  );
                if (sid === 'projects')
                  return (
                    Array.isArray(profile.projects) &&
                    profile.projects.length > 0
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
                  return (
                    Array.isArray(profile.awards) && profile.awards.length > 0
                  );
                return false;
              };
              const visible = isSectionVisible(id);
              const hasNextVisible =
                visible && order.slice(idx + 1).some(isSectionVisible);
              return (
                <motion.div
                  key={`section:${id}`}
                  layout
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                >
                  {visible && <Section id={id} />}
                  {visible && hasNextVisible && <Separator className="my-6" />}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
