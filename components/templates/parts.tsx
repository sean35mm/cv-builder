import type { ReactNode } from 'react';
import {
  displayUrl,
  formatDate,
  normalizeExternalUrl,
} from '@/lib/profile-format';
import { resolveVisibleSections } from '@/lib/profile/rendering';
import {
  LANGUAGE_PROFICIENCY_LABELS,
  type ProfileContent,
  type SectionId,
  type SectionsVisibility,
} from '@/lib/profile/domain';
import { cn } from '@/lib/utils';

// Shared data plumbing for the three templates. Each template owns its own
// layout and type; everything here only shapes content so that missing
// optional fields never produce empty rows or stray separators.

// Approved testimonials, as getPublicTestimonials returns them. They live in
// their own table, so they arrive beside the profile rather than inside it.
export type ProfileTestimonial = {
  _id: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  relationship: string;
  content: string;
};

export type TemplateProps = {
  profile: ProfileContent;
  sectionsVisibility?: SectionsVisibility;
  testimonials?: ProfileTestimonial[];
};

export type EntrySectionId =
  | 'experience'
  | 'education'
  | 'projects'
  | 'publications'
  | 'certifications'
  | 'volunteering'
  | 'exhibitions'
  | 'awards';

export type TermSectionId = 'skills' | 'languages' | 'interests';

export type Entry = {
  id: string;
  title: string;
  subtitle?: string;
  start?: string;
  end?: string;
  current?: boolean;
  description?: string;
  href?: string;
  linkText?: string;
  tags: string[];
  images: string[];
  featured?: boolean;
};

export type Term = { key: string; label: string; detail?: string };

export const SECTION_TITLES: Record<SectionId, string> = {
  header: 'Profile',
  bio: 'About',
  contact: 'Contact',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  languages: 'Languages',
  projects: 'Projects',
  publications: 'Publications',
  certifications: 'Certifications',
  volunteering: 'Volunteering',
  exhibitions: 'Exhibitions',
  awards: 'Awards',
  interests: 'Interests',
  testimonials: 'Testimonials',
};

const ENTRY_SECTIONS: readonly SectionId[] = [
  'experience',
  'education',
  'projects',
  'publications',
  'certifications',
  'volunteering',
  'exhibitions',
  'awards',
];

export const isEntrySection = (id: SectionId): id is EntrySectionId =>
  ENTRY_SECTIONS.includes(id);

export const isTermSection = (id: SectionId): id is TermSectionId =>
  id === 'skills' || id === 'languages' || id === 'interests';

const list = <T,>(value: T[] | undefined | null): T[] =>
  Array.isArray(value) ? value : [];

const text = (value?: string | null): string | undefined =>
  value?.trim() || undefined;

const join = (parts: (string | undefined)[], separator = ' · ') =>
  parts.map(text).filter(Boolean).join(separator) || undefined;

/** Sections to render, in the profile's order, minus header/contact (the
 * masthead owns those) and anything empty or hidden. */
export function bodySections(
  { profile, sectionsVisibility, testimonials }: TemplateProps,
  omit: SectionId[] = []
): SectionId[] {
  return resolveVisibleSections(profile, {
    sectionsVisibility,
    testimonialCount: toTestimonials(testimonials).length,
  }).filter(
    (id) =>
      id !== 'header' &&
      id !== 'contact' &&
      !omit.includes(id) &&
      // Blank strings count as content upstream; they must not leave a heading.
      !(id === 'bio' && !text(profile.bio)) &&
      !(isTermSection(id) && toTerms(profile, id).length === 0)
  );
}

export function isVisible(
  profile: ProfileContent,
  sectionsVisibility: SectionsVisibility | undefined,
  id: SectionId
): boolean {
  return resolveVisibleSections(profile, { sectionsVisibility }).includes(id);
}

const link = (url?: string) => {
  const href = normalizeExternalUrl(url);
  return href ? { href, linkText: displayUrl(href) } : {};
};

export function toEntries(
  profile: ProfileContent,
  id: EntrySectionId
): Entry[] {
  switch (id) {
    case 'experience':
      return list(profile.experience).map((item) => ({
        id: item.id,
        title: item.role,
        subtitle: text(item.company),
        start: item.startDate,
        end: item.endDate,
        current: item.current,
        description: text(item.description),
        tags: [],
        images: [],
      }));
    case 'education':
      return list(profile.education).map((item) => ({
        id: item.id,
        title: item.degree,
        subtitle: text(item.school),
        start: item.startDate,
        end: item.endDate,
        current: item.current,
        description: text(item.description),
        tags: [],
        images: [],
      }));
    case 'volunteering':
      return list(profile.volunteering).map((item) => ({
        id: item.id,
        title: item.role,
        subtitle: text(item.organization),
        start: item.startDate,
        end: item.endDate,
        current: item.current,
        description: text(item.description),
        tags: [],
        images: [],
      }));
    case 'projects':
      return list(profile.projects).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: join([item.company, item.category]),
        start: item.year,
        description: text(item.description),
        ...link(item.link),
        tags: list(item.technologies).filter(Boolean),
        images: list(item.images).filter(Boolean),
        featured: item.isFeatured,
      }));
    case 'publications':
      return list(profile.publications).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: join([list(item.authors).join(', '), item.publisher]),
        start: item.date,
        description: text(item.description),
        ...link(item.url),
        tags: [],
        images: [],
      }));
    case 'certifications':
      return list(profile.certifications).map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: join([
          item.issuer,
          text(item.credentialId) && `Credential ${item.credentialId}`,
        ]),
        start: item.year,
        description: text(item.description),
        ...link(item.link),
        tags: [],
        images: [],
      }));
    case 'exhibitions':
      return list(profile.exhibitions).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: join([item.venue, item.location], ', '),
        start: item.year,
        description: text(item.description),
        ...link(item.link),
        tags: [],
        images: list(item.images).filter(Boolean),
      }));
    case 'awards':
      return list(profile.awards).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: text(item.issuer),
        start: item.year,
        description: text(item.description),
        ...link(item.link),
        tags: [],
        images: list(item.images).filter(Boolean),
      }));
  }
}

export function toTerms(profile: ProfileContent, id: TermSectionId): Term[] {
  if (id === 'languages') {
    return list(profile.languages)
      .filter((item) => text(item.name))
      .map((item) => ({
        key: item.id,
        label: item.name,
        detail: item.proficiency
          ? LANGUAGE_PROFICIENCY_LABELS[item.proficiency]
          : undefined,
      }));
  }
  const values = id === 'skills' ? profile.skills : profile.interests;
  return list(values)
    .filter((value) => text(value))
    .map((value, index) => ({ key: `${index}-${value}`, label: value }));
}

export type Testimonial = {
  id: string;
  content: string;
  author: string;
  byline?: string;
};

/** Testimonials with text, bylined "Title, Company · Relationship". */
export function toTestimonials(
  testimonials: ProfileTestimonial[] | undefined
): Testimonial[] {
  return list(testimonials)
    .filter((item) => text(item.content) && text(item.authorName))
    .map((item) => ({
      id: item._id,
      content: item.content.trim(),
      author: item.authorName.trim(),
      byline: join([
        join([item.authorTitle, item.authorCompany], ', '),
        item.relationship,
      ]),
    }));
}

// Dates ----------------------------------------------------------------------

const ISO_DATE = /^\d{4}(-\d{2}){0,2}$/;

function dateLabel(value: string, style: 'month' | 'year'): string {
  if (style === 'year') return /^\d{4}/.exec(value)?.[0] ?? value;
  return /^\d{4}-\d{2}/.test(value) ? formatDate(value) : value;
}

function Time({ value, style }: { value: string; style: 'month' | 'year' }) {
  const label = dateLabel(value, style);
  return ISO_DATE.test(value) ? (
    <time dateTime={value}>{label}</time>
  ) : (
    <span>{label}</span>
  );
}

export const hasDates = (entry: Entry) =>
  Boolean(text(entry.start) || text(entry.end) || entry.current);

/** "Mar 2021 – Now", "2019", "2016 – 2021". Renders nothing without dates. */
export function DateRange({
  entry,
  style = 'month',
}: {
  entry: Entry;
  style?: 'month' | 'year';
}) {
  const start = text(entry.start);
  const end = entry.current ? undefined : text(entry.end);
  const from = start ? <Time value={start} style={style} /> : null;
  const to = entry.current ? (
    'Now'
  ) : end && (!start || dateLabel(end, style) !== dateLabel(start, style)) ? (
    <Time value={end} style={style} />
  ) : null;
  if (!from && !to) return null;
  if (!from || !to) return <>{from ?? to}</>;
  return (
    <>
      {from}
      {' – '}
      {to}
    </>
  );
}

// Links ----------------------------------------------------------------------

export const linkClassName =
  'underline decoration-p-faint decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-p-accent hover:decoration-p-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-accent';

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(linkClassName, className)}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export type ContactLink = {
  key: string;
  label: string;
  href: string;
  text: string;
  external: boolean;
};

const socialHref = (value: string | undefined, base: string) => {
  const handle = text(value);
  if (!handle) return undefined;
  return normalizeExternalUrl(
    /^https?:\/\//i.test(handle) ? handle : `${base}${handle.replace(/^@/, '')}`
  );
};

const shortUrl = (href: string) => {
  const url = new URL(href);
  return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`;
};

/** Email, website and social links that resolve to a safe URL. */
export function contactLinks(profile: ProfileContent): ContactLink[] {
  const links: ContactLink[] = [];
  const email = text(profile.email);
  if (email) {
    links.push({
      key: 'email',
      label: 'Email',
      href: `mailto:${email}`,
      text: email,
      external: false,
    });
  }
  const website = normalizeExternalUrl(profile.website);
  if (website) {
    links.push({
      key: 'website',
      label: 'Website',
      href: website,
      text: shortUrl(website),
      external: true,
    });
  }
  for (const [key, label, base] of [
    ['github', 'GitHub', 'https://github.com/'],
    ['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/'],
    ['twitter', 'X', 'https://x.com/'],
  ] as const) {
    const href = socialHref(profile[key], base);
    if (href) {
      links.push({ key, label, href, text: shortUrl(href), external: true });
    }
  }
  return links;
}

export function ContactAnchor({
  item,
  className,
  children,
}: {
  item: ContactLink;
  className?: string;
  children?: ReactNode;
}) {
  const content = children ?? item.text;
  return item.external ? (
    <ExternalLink href={item.href} className={className}>
      {content}
    </ExternalLink>
  ) : (
    <a href={item.href} className={cn(linkClassName, className)}>
      {content}
    </a>
  );
}

// Media ----------------------------------------------------------------------

export function Avatar({
  profile,
  className,
}: {
  profile: ProfileContent;
  className?: string;
}) {
  if (!profile.avatar) return null;
  return (
    <img
      src={profile.avatar}
      alt={`${profile.name}, portrait`}
      width={160}
      height={160}
      className={cn('shrink-0 bg-p-surface object-cover', className)}
    />
  );
}

export function EntryImage({
  entry,
  index,
  className,
  eager = false,
}: {
  entry: Entry;
  index: number;
  className?: string;
  eager?: boolean;
}) {
  const total = entry.images.length;
  return (
    <img
      src={entry.images[index]}
      alt={
        total > 1
          ? `${entry.title}, image ${index + 1} of ${total}`
          : entry.title
      }
      width={1200}
      height={800}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={cn(
        'block w-full bg-p-surface object-cover print:break-inside-avoid',
        className
      )}
    />
  );
}

/** Screen-reader h1 for when the owner hides the header section. */
export function HiddenHeading({ profile }: { profile: ProfileContent }) {
  return <h1 className="sr-only">{profile.username}</h1>;
}
