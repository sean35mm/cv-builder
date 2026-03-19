import React from 'react';
import { Document, Page, View, Text, Link } from '@react-pdf/renderer';
import { createStyles } from './styles';
import { getThemeColors } from './theme-colors';
import { formatDate, formatRange, displayUrl } from '@/lib/profile-format';
import {
  DEFAULT_SECTIONS_ORDER,
  SECTION_IDS,
  type ProfileContent,
  type SectionId,
} from '@/lib/types';

type ResumeDocumentProps = {
  profile: ProfileContent;
  themed?: boolean;
  colorTheme?: string;
};

function sanitizeOrder(order?: SectionId[]): SectionId[] {
  if (!order || order.length === 0) return DEFAULT_SECTIONS_ORDER;
  const seen = new Set<SectionId>();
  const result: SectionId[] = [];
  for (const s of order) {
    if (SECTION_IDS.includes(s) && !seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
  }
  for (const s of DEFAULT_SECTIONS_ORDER) {
    if (!seen.has(s)) result.push(s);
  }
  return result;
}

function isSectionVisible(id: SectionId, profile: ProfileContent): boolean {
  switch (id) {
    case 'header':
    case 'bio':
    case 'contact':
      return false; // rendered inline in header
    case 'experience':
      return profile.experience.length > 0;
    case 'education':
      return profile.education.length > 0;
    case 'skills':
      return profile.skills.length > 0;
    case 'projects':
      return profile.projects.length > 0;
    case 'certifications':
      return profile.certifications.length > 0;
    case 'volunteering':
      return profile.volunteering.length > 0;
    case 'exhibitions':
      return profile.exhibitions.length > 0;
    case 'awards':
      return profile.awards.length > 0;
    default:
      return false;
  }
}

export function ResumeDocument({
  profile,
  themed = false,
  colorTheme,
}: ResumeDocumentProps) {
  const colors = getThemeColors(colorTheme, themed);
  const s = createStyles(colors);
  const order = sanitizeOrder(profile.sectionsOrder);
  const visibleSections = order.filter((id) => isSectionVisible(id, profile));

  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.website) contactParts.push(displayUrl(profile.website) ?? '');
  if (profile.github) contactParts.push(`github.com/${profile.github}`);
  if (profile.linkedin)
    contactParts.push(`linkedin.com/in/${profile.linkedin}`);
  if (profile.twitter) contactParts.push(`x.com/${profile.twitter}`);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View>
          <Text style={s.name}>{profile.name}</Text>
          {(profile.title || profile.location) && (
            <Text style={s.subtitle}>
              {[profile.title, profile.location]
                .filter(Boolean)
                .join(' \u00b7 ')}
            </Text>
          )}
          {contactParts.length > 0 && (
            <View style={s.contactRow}>
              {contactParts.map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Text style={s.contactSeparator}>|</Text>}
                  <Text style={s.contactItem}>{part}</Text>
                </React.Fragment>
              ))}
            </View>
          )}
          {profile.bio && <Text style={s.bio}>{profile.bio}</Text>}
        </View>

        {/* Sections */}
        {visibleSections.map((id) => (
          <View key={id} style={s.section}>
            {id === 'experience' && (
              <>
                <Text style={s.sectionHeader}>Experience</Text>
                {profile.experience.map((exp) => (
                  <View key={exp.id} style={s.entryRow} wrap={false}>
                    <Text style={s.entryDate}>
                      {formatRange(exp.startDate, exp.endDate, exp.current)}
                    </Text>
                    <View style={s.entryContent}>
                      <Text style={s.entryTitle}>{exp.role}</Text>
                      <Text style={s.entrySubtitle}>{exp.company}</Text>
                      {exp.description && (
                        <Text style={s.entryDescription}>
                          {exp.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}

            {id === 'education' && (
              <>
                <Text style={s.sectionHeader}>Education</Text>
                {profile.education.map((edu) => (
                  <View key={edu.id} style={s.entryRow} wrap={false}>
                    <Text style={s.entryDate}>
                      {formatRange(edu.startDate, edu.endDate, edu.current)}
                    </Text>
                    <View style={s.entryContent}>
                      <Text style={s.entryTitle}>{edu.degree}</Text>
                      <Text style={s.entrySubtitle}>{edu.school}</Text>
                      {edu.description && (
                        <Text style={s.entryDescription}>
                          {edu.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}

            {id === 'skills' && (
              <>
                <Text style={s.sectionHeader}>Skills</Text>
                <View style={s.skillsRow}>
                  {profile.skills.map((skill) => (
                    <Text key={skill} style={s.skill}>
                      {skill}
                    </Text>
                  ))}
                </View>
              </>
            )}

            {id === 'projects' && (
              <>
                <Text style={s.sectionHeader}>Projects</Text>
                {profile.projects.map((proj) => (
                  <View key={proj.id} style={s.simpleEntry} wrap={false}>
                    <Text style={s.simpleTitle}>
                      {proj.title}
                      {proj.year ? ` (${proj.year})` : ''}
                    </Text>
                    {proj.company && (
                      <Text style={s.simpleMeta}>{proj.company}</Text>
                    )}
                    {proj.link && (
                      <Link
                        src={
                          proj.link.startsWith('http')
                            ? proj.link
                            : `https://${proj.link}`
                        }
                        style={s.link}
                      >
                        {displayUrl(proj.link)}
                      </Link>
                    )}
                    {proj.description && (
                      <Text style={s.simpleDescription}>
                        {proj.description}
                      </Text>
                    )}
                  </View>
                ))}
              </>
            )}

            {id === 'certifications' && (
              <>
                <Text style={s.sectionHeader}>Certifications</Text>
                {profile.certifications.map((cert) => (
                  <View key={cert.id} style={s.simpleEntry} wrap={false}>
                    <Text style={s.simpleTitle}>
                      {cert.name}
                      {cert.year ? ` (${cert.year})` : ''}
                    </Text>
                    <Text style={s.simpleMeta}>{cert.issuer}</Text>
                    {cert.link && (
                      <Link
                        src={
                          cert.link.startsWith('http')
                            ? cert.link
                            : `https://${cert.link}`
                        }
                        style={s.link}
                      >
                        {displayUrl(cert.link)}
                      </Link>
                    )}
                    {cert.description && (
                      <Text style={s.simpleDescription}>
                        {cert.description}
                      </Text>
                    )}
                  </View>
                ))}
              </>
            )}

            {id === 'volunteering' && (
              <>
                <Text style={s.sectionHeader}>Volunteering</Text>
                {profile.volunteering.map((vol) => (
                  <View key={vol.id} style={s.entryRow} wrap={false}>
                    <Text style={s.entryDate}>
                      {formatRange(vol.startDate, vol.endDate, vol.current)}
                    </Text>
                    <View style={s.entryContent}>
                      <Text style={s.entryTitle}>{vol.role}</Text>
                      <Text style={s.entrySubtitle}>{vol.organization}</Text>
                      {vol.description && (
                        <Text style={s.entryDescription}>
                          {vol.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}

            {id === 'exhibitions' && (
              <>
                <Text style={s.sectionHeader}>Exhibitions</Text>
                {profile.exhibitions.map((exh) => (
                  <View key={exh.id} style={s.simpleEntry} wrap={false}>
                    <Text style={s.simpleTitle}>
                      {exh.title}
                      {exh.year ? ` (${exh.year})` : ''}
                    </Text>
                    {(exh.venue || exh.location) && (
                      <Text style={s.simpleMeta}>
                        {[exh.venue, exh.location].filter(Boolean).join(', ')}
                      </Text>
                    )}
                    {exh.link && (
                      <Link
                        src={
                          exh.link.startsWith('http')
                            ? exh.link
                            : `https://${exh.link}`
                        }
                        style={s.link}
                      >
                        {displayUrl(exh.link)}
                      </Link>
                    )}
                    {exh.description && (
                      <Text style={s.simpleDescription}>{exh.description}</Text>
                    )}
                  </View>
                ))}
              </>
            )}

            {id === 'awards' && (
              <>
                <Text style={s.sectionHeader}>Awards</Text>
                {profile.awards.map((award) => (
                  <View key={award.id} style={s.simpleEntry} wrap={false}>
                    <Text style={s.simpleTitle}>
                      {award.title}
                      {award.year ? ` (${award.year})` : ''}
                    </Text>
                    <Text style={s.simpleMeta}>{award.issuer}</Text>
                    {award.link && (
                      <Link
                        src={
                          award.link.startsWith('http')
                            ? award.link
                            : `https://${award.link}`
                        }
                        style={s.link}
                      >
                        {displayUrl(award.link)}
                      </Link>
                    )}
                    {award.description && (
                      <Text style={s.simpleDescription}>
                        {award.description}
                      </Text>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>
        ))}

        {/* Footer */}
        <Text style={s.footer} fixed>
          opencv.app/@{profile.name.toLowerCase().replace(/\s+/g, '')}
        </Text>
      </Page>
    </Document>
  );
}
