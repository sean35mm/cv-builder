import React from 'react';
import { Document, Page, View, Text, Link } from '@react-pdf/renderer';
import { createStyles } from './styles';
import { getThemeColors } from './theme-colors';
import {
  formatRange,
  displayUrl,
  normalizeExternalUrl,
} from '@/lib/profile-format';
import { resolveVisibleSections } from '@/lib/profile/rendering';
import type { ProfileContent } from '@/lib/types';

type ResumeDocumentProps = {
  profile: ProfileContent;
  themed?: boolean;
  colorTheme?: string;
  sectionsVisibility?: Record<string, boolean>;
  testimonials?: Array<{
    _id: string;
    authorName: string;
    authorTitle?: string;
    authorCompany?: string;
    content: string;
  }>;
};

export function ResumeDocument({
  profile,
  themed = false,
  colorTheme,
  sectionsVisibility,
  testimonials = [],
}: ResumeDocumentProps) {
  const colors = getThemeColors(colorTheme, themed);
  const s = createStyles(colors);
  const visibleSections = resolveVisibleSections(profile, {
    sectionsVisibility,
    testimonialCount: testimonials.length,
  });

  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.website) contactParts.push(displayUrl(profile.website) ?? '');
  if (profile.github) contactParts.push(`github.com/${profile.github}`);
  if (profile.linkedin)
    contactParts.push(`linkedin.com/in/${profile.linkedin}`);
  if (profile.twitter) contactParts.push(`x.com/${profile.twitter}`);
  const projectUrls = new Map(
    profile.projects.map((project) => [
      project.id,
      normalizeExternalUrl(project.link),
    ])
  );
  const certificationUrls = new Map(
    profile.certifications.map((certification) => [
      certification.id,
      normalizeExternalUrl(certification.link),
    ])
  );
  const exhibitionUrls = new Map(
    profile.exhibitions.map((exhibition) => [
      exhibition.id,
      normalizeExternalUrl(exhibition.link),
    ])
  );
  const awardUrls = new Map(
    profile.awards.map((award) => [award.id, normalizeExternalUrl(award.link)])
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {visibleSections.map((id) => (
          <React.Fragment key={id}>
            {id === 'header' && (
              <View>
                <Text style={s.name}>{profile.name}</Text>
                {(profile.title || profile.location) && (
                  <Text style={s.subtitle}>
                    {[profile.title, profile.location]
                      .filter(Boolean)
                      .join(' \u00b7 ')}
                  </Text>
                )}
              </View>
            )}
            {id === 'contact' && contactParts.length > 0 && (
              <View style={s.contactRow}>
                {contactParts.map((part, i) => (
                  <React.Fragment key={part}>
                    {i > 0 && <Text style={s.contactSeparator}>|</Text>}
                    <Text style={s.contactItem}>{part}</Text>
                  </React.Fragment>
                ))}
              </View>
            )}
            {id === 'bio' && profile.bio && (
              <Text style={s.bio}>{profile.bio}</Text>
            )}
            {id !== 'header' && id !== 'contact' && id !== 'bio' && (
              <View style={s.section}>
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
                        {projectUrls.get(proj.id) ? (
                          <Link src={projectUrls.get(proj.id)} style={s.link}>
                            {displayUrl(proj.link)}
                          </Link>
                        ) : proj.link ? (
                          <Text style={s.link}>{proj.link}</Text>
                        ) : null}
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
                        {certificationUrls.get(cert.id) ? (
                          <Link
                            src={certificationUrls.get(cert.id)}
                            style={s.link}
                          >
                            {displayUrl(cert.link)}
                          </Link>
                        ) : cert.link ? (
                          <Text style={s.link}>{cert.link}</Text>
                        ) : null}
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
                          <Text style={s.entrySubtitle}>
                            {vol.organization}
                          </Text>
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
                            {[exh.venue, exh.location]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                        )}
                        {exhibitionUrls.get(exh.id) ? (
                          <Link src={exhibitionUrls.get(exh.id)} style={s.link}>
                            {displayUrl(exh.link)}
                          </Link>
                        ) : exh.link ? (
                          <Text style={s.link}>{exh.link}</Text>
                        ) : null}
                        {exh.description && (
                          <Text style={s.simpleDescription}>
                            {exh.description}
                          </Text>
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
                        {awardUrls.get(award.id) ? (
                          <Link src={awardUrls.get(award.id)} style={s.link}>
                            {displayUrl(award.link)}
                          </Link>
                        ) : award.link ? (
                          <Text style={s.link}>{award.link}</Text>
                        ) : null}
                        {award.description && (
                          <Text style={s.simpleDescription}>
                            {award.description}
                          </Text>
                        )}
                      </View>
                    ))}
                  </>
                )}

                {id === 'testimonials' && (
                  <>
                    <Text style={s.sectionHeader}>Testimonials</Text>
                    {testimonials.map((testimonial) => (
                      <View
                        key={testimonial._id}
                        style={s.simpleEntry}
                        wrap={false}
                      >
                        <Text style={s.simpleDescription}>
                          “{testimonial.content}”
                        </Text>
                        <Text style={s.simpleMeta}>
                          {[
                            testimonial.authorName,
                            testimonial.authorTitle,
                            testimonial.authorCompany,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </React.Fragment>
        ))}

        {/* Footer */}
        <Text style={s.footer} fixed>
          opencv.app/@{profile.username}
        </Text>
      </Page>
    </Document>
  );
}
