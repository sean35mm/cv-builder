import type { ProfileContent, SectionId } from '@/lib/types';
import {
  Avatar,
  bodySections,
  ContactAnchor,
  contactLinks,
  DateRange,
  EntryImage,
  ExternalLink,
  hasDates,
  HiddenHeading,
  isEntrySection,
  isTermSection,
  isVisible,
  SECTION_TITLES,
  toEntries,
  toTerms,
  toTestimonials,
  type Entry,
  type TemplateProps,
  type Testimonial,
} from './parts';

// Ledger: a typeset index. Section labels sit in a left mono gutter (from
// 48rem), years in a second gutter (from 32rem), content at 14px.
const SECTION_GRID =
  '@3xl:grid @3xl:grid-cols-[6.5rem_minmax(0,1fr)] @3xl:gap-x-6';
const ROW_GRID = '@lg:grid @lg:grid-cols-[6rem_minmax(0,1fr)] @lg:gap-x-6';
const ALIGN_CONTENT = '@lg:pl-[7.5rem]';

export function MinimalView(props: TemplateProps) {
  const { profile, sectionsVisibility } = props;
  const showHeader = isVisible(profile, sectionsVisibility, 'header');
  const links = isVisible(profile, sectionsVisibility, 'contact')
    ? contactLinks(profile)
    : [];
  const location = showHeader ? profile.location?.trim() : undefined;
  const sections = bodySections(props);
  const testimonials = toTestimonials(props.testimonials);

  return (
    <article className="@container mx-auto w-full max-w-[54rem] px-5 py-10 text-[14px] leading-[1.55] text-p-fg @lg:px-8 @3xl:px-10 @3xl:py-14 print:p-0">
      <header className={`pb-8 ${SECTION_GRID}`}>
        {showHeader && (
          <Avatar
            profile={profile}
            className="mb-4 size-12 rounded-[3px] @3xl:mb-0"
          />
        )}
        <div className="min-w-0 @3xl:col-start-2">
          {showHeader ? (
            <>
              <h1 className="text-[1.375rem] font-semibold leading-tight tracking-[-0.015em]">
                {profile.name}
              </h1>
              {profile.title && (
                <p className="mt-0.5 text-[15px] text-p-muted">
                  {profile.title}
                </p>
              )}
            </>
          ) : (
            <HiddenHeading profile={profile} />
          )}
          {(location || links.length > 0) && (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] text-p-muted">
              {location && <li>{location}</li>}
              {links.map((item) => (
                <li key={item.key}>
                  <ContactAnchor item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {sections.map((id) => (
        <section
          key={id}
          className={`border-t border-p-line py-5 ${SECTION_GRID}`}
        >
          <h2 className="mb-3 font-mono text-[11px] uppercase leading-[21px] tracking-[0.08em] text-p-muted @3xl:mb-0">
            {SECTION_TITLES[id]}
          </h2>
          <div className="min-w-0">
            <MinimalSectionBody
              id={id}
              profile={profile}
              testimonials={testimonials}
            />
          </div>
        </section>
      ))}
    </article>
  );
}

function MinimalSectionBody({
  id,
  profile,
  testimonials,
}: {
  id: SectionId;
  profile: ProfileContent;
  testimonials: Testimonial[];
}) {
  if (id === 'bio') {
    return (
      <p className={`max-w-[62ch] whitespace-pre-line ${ALIGN_CONTENT}`}>
        {profile.bio}
      </p>
    );
  }
  if (isEntrySection(id)) {
    return (
      <ol className="space-y-4">
        {toEntries(profile, id).map((entry) => (
          <MinimalEntry key={entry.id} entry={entry} />
        ))}
      </ol>
    );
  }
  if (isTermSection(id)) {
    const terms = toTerms(profile, id);
    if (terms.some((term) => term.detail)) {
      return (
        <ul className={`grid gap-x-6 @md:grid-cols-2 ${ALIGN_CONTENT}`}>
          {terms.map((term) => (
            <li key={term.key} className="flex flex-wrap gap-x-2">
              <span>{term.label}</span>
              {term.detail && (
                <span className="text-p-muted">{term.detail}</span>
              )}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <ul className={ALIGN_CONTENT}>
        {terms.map((term) => (
          <li
            key={term.key}
            className="inline after:content-[',_'] last:after:content-none"
          >
            {term.label}
          </li>
        ))}
      </ul>
    );
  }
  if (id === 'testimonials') {
    return (
      <ul className={`space-y-4 ${ALIGN_CONTENT}`}>
        {testimonials.map((item) => (
          <li key={item.id} className="break-inside-avoid">
            <figure>
              <blockquote className="max-w-[62ch] whitespace-pre-line">
                “{item.content}”
              </blockquote>
              <figcaption className="mt-0.5 text-p-muted">
                <span className="font-medium text-p-fg">{item.author}</span>
                {item.byline && <> · {item.byline}</>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

function MinimalEntry({ entry }: { entry: Entry }) {
  return (
    <li className={`break-inside-avoid ${ROW_GRID}`}>
      {hasDates(entry) && (
        <p className="font-mono text-[12px] leading-[21px] tabular-nums text-p-muted">
          <DateRange entry={entry} style="year" />
        </p>
      )}
      <div className="min-w-0 @lg:col-start-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="font-medium">{entry.title}</h3>
          {entry.subtitle && <p className="text-p-muted">{entry.subtitle}</p>}
        </div>
        {entry.description && (
          <p className="mt-0.5 max-w-[62ch] whitespace-pre-line text-p-muted">
            {entry.description}
          </p>
        )}
        {entry.images.length > 0 && (
          <div className="mt-2 grid max-w-[30rem] grid-cols-4 gap-1.5">
            {entry.images.map((src, index) => (
              <EntryImage
                key={`${index}-${src}`}
                entry={entry}
                index={index}
                className="aspect-[4/3] rounded-[2px]"
              />
            ))}
          </div>
        )}
        {(entry.tags.length > 0 || entry.href) && (
          <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[12px] text-p-muted">
            {entry.tags.length > 0 && (
              <p>
                <span className="sr-only">Built with </span>
                {entry.tags.join(' / ')}
              </p>
            )}
            {entry.href && (
              <ExternalLink href={entry.href} className="text-p-fg">
                {entry.linkText}
              </ExternalLink>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
