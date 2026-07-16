import { StyleSheet } from '@react-pdf/renderer';
import { getPdfFontFamily } from '@/lib/profile/typography';

export function createStyles(colors: {
  primary: string;
  foreground: string;
  muted: string;
  border: string;
}, typography?: { headingFont?: unknown; bodyFont?: unknown }) {
  const headingFont = getPdfFontFamily(typography?.headingFont);
  const bodyFont = getPdfFontFamily(typography?.bodyFont);

  return StyleSheet.create({
    page: {
      fontFamily: bodyFont.regular,
      fontSize: 10,
      color: colors.foreground,
      paddingTop: 40,
      paddingBottom: 48,
      paddingHorizontal: 44,
    },
    // Header
    name: {
      fontSize: 22,
      fontFamily: headingFont.bold,
      color: colors.primary,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 10,
      color: colors.muted,
      marginBottom: 4,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 2,
      marginBottom: 6,
    },
    contactItem: {
      fontSize: 8.5,
      color: colors.muted,
    },
    contactSeparator: {
      fontSize: 8.5,
      color: colors.border,
      marginHorizontal: 4,
    },
    // Bio
    bio: {
      fontSize: 9,
      lineHeight: 1.4,
      color: colors.foreground,
      marginTop: 4,
    },
    // Section
    section: {
      marginTop: 14,
    },
    sectionHeader: {
      fontSize: 8.5,
      fontFamily: headingFont.bold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      minPresenceAhead: 40,
    },
    // Experience / Education / Volunteering entry
    entryRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    entryDate: {
      width: 110,
      fontSize: 8,
      color: colors.muted,
      paddingTop: 1,
      paddingRight: 8,
    },
    entryContent: {
      flex: 1,
    },
    entryTitle: {
      fontSize: 9.5,
      fontFamily: bodyFont.bold,
      color: colors.foreground,
      marginBottom: 1,
    },
    entrySubtitle: {
      fontSize: 8.5,
      color: colors.muted,
      marginBottom: 2,
    },
    entryDescription: {
      fontSize: 8.5,
      lineHeight: 1.4,
      color: colors.foreground,
    },
    // Skills
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
    },
    skill: {
      fontSize: 8.5,
      color: colors.foreground,
      backgroundColor: '#F0F0F0',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    // Simple entries (projects, certs, exhibitions, awards)
    simpleEntry: {
      marginBottom: 7,
    },
    simpleTitle: {
      fontSize: 9.5,
      fontFamily: bodyFont.bold,
      color: colors.foreground,
      marginBottom: 1,
    },
    simpleMeta: {
      fontSize: 8.5,
      color: colors.muted,
      marginBottom: 1,
    },
    simpleDescription: {
      fontSize: 8.5,
      lineHeight: 1.4,
      color: colors.foreground,
    },
    link: {
      fontSize: 8.5,
      color: colors.primary,
      textDecoration: 'none',
      marginBottom: 1,
    },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 24,
      left: 44,
      right: 44,
      textAlign: 'center',
      fontSize: 7.5,
      color: colors.muted,
    },
  });
}
