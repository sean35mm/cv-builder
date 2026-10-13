import type { ProfileContent, SectionId } from '@/lib/types';
import { cn } from '@/lib/utils';
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
  type Entry,
  type TemplateProps,
} from './parts';

// Editorial: one centred 640px column, set like a magazine profile.
export function ClassicView({ profile, sectionsVisibility }: TemplateProps) {
  const showHeader = isVisible(profile, sectionsVisibility, 'header');
  const links = isVisible(profile, sectionsVisibility, 'contact')
    ? contactLinks(profile)
    : [];
  const location = showHeader ? profile.location?.trim() : undefined;
  const sections = bodySections(profile, sectionsVisibility);

  return (
    <article className="@container mx-auto w-full max-w-[44rem] px-6 pb-20 pt-14 @lg:px-8 @2xl:pb-28 @2xl:pt-24 print:p-0">
      <header>
        {showHeader ? (
          <>
            <Avatar profile={profile} className="mb-8 size-16 rounded-full" />
            <h1 className="font-serif text-[2.5rem] font-normal leading-[1.04] tracking-[-0.022em] text-p-fg @md:text-[3.25rem] @2xl:text-[3.75rem]">
              {profile.name}
            </h1>
            {profile.title && (
              <p className="mt-3 font-serif text-[1.3125rem] italic leading-snug text-p-muted @md:text-2xl">
                {profile.title}
              </p>
            )}
          </>
        ) : (
          <HiddenHeading profile={profile} />
        )}
        {(location || links.length > 0) && (
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[12.5px] leading-5 text-p-muted">
            {location && <li>{location}</li>}
            {links.map((item) => (
              <li key={item.key}>
                <ContactAnchor item={item} />
              </li>
            ))}
          </ul>
        )}
      </header>

      {sections.length > 0 && (
        <div className="mt-14 space-y-14 @2xl:mt-20 @2xl:space-y-16">
          {sections.map((id) => (
            <ClassicSection key={id} id={id} profile={profile} />
          ))}
        </div>
      )}
    </article>
  );
}

function ClassicSection({
  id,
  profile,
}: {
  id: SectionId;
  profile: ProfileContent;
}) {
  if (id === 'bio') {
    return (
      <section>
        <h2 className="sr-only">{SECTION_TITLES.bio}</h2>
        <p className="whitespace-pre-line font-serif text-[1.1875rem] leading-[1.6] text-p-fg @md:text-[1.3125rem] @md:leading-[1.55]">
          {profile.bio}
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="flex items-center gap-4 text-[11px] font-medium uppercase leading-none tracking-[0.16em] text-p-accent after:h-px after:flex-1 after:bg-p-line">
        {SECTION_TITLES[id]}
      </h2>
      {isEntrySection(id) && (
        <ol className="mt-7 space-y-9">
          {toEntries(profile, id).map((entry, index) => (
            <ClassicEntry
              key={entry.id}
              entry={entry}
              eager={id === 'projects' && index === 0}
            />
          ))}
        </ol>
      )}
      {isTermSection(id) && <ClassicTerms id={id} profile={profile} />}
    </section>
  );
}

function ClassicEntry({ entry, eager }: { entry: Entry; eager: boolean }) {
  const count = entry.images.length;
  return (
    <li className="break-inside-avoid">
      {count > 0 && (
        <div className={cn('mb-5 grid gap-2', count > 1 && 'grid-cols-2')}>
          {entry.images.map((src, index) => (
            <EntryImage
              key={`${index}-${src}`}
              entry={entry}
              index={index}
              eager={eager && index === 0}
              className={
                count === 1 || (index === 0 && count % 2 === 1)
                  ? 'col-span-2 aspect-[3/2]'
                  : 'aspect-[4/3]'
              }
            />
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="min-w-0 font-serif text-[1.25rem] leading-snug text-p-fg">
          {entry.title}
        </h3>
        {hasDates(entry) && (
          <p className="shrink-0 font-mono text-[12px] tabular-nums text-p-muted">
            <DateRange entry={entry} />
          </p>
        )}
      </div>
      {entry.subtitle && (
        <p className="mt-0.5 text-[14px] text-p-muted">{entry.subtitle}</p>
      )}
      {entry.description && (
        <p className="mt-3 whitespace-pre-line font-serif text-[17px] leading-[1.6] text-p-fg">
          {entry.description}
        </p>
      )}
      {(entry.tags.length > 0 || entry.href) && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-p-muted">
          {entry.tags.length > 0 && (
            <p>
              <span className="sr-only">Built with </span>
              {entry.tags.join(', ')}
            </p>
          )}
          {entry.href && (
            <ExternalLink href={entry.href} className="text-p-fg">
              {entry.linkText}
            </ExternalLink>
          )}
        </div>
      )}
    </li>
  );
}

function ClassicTerms({
  id,
  profile,
}: {
  id: 'skills' | 'languages' | 'interests';
  profile: ProfileContent;
}) {
  const terms = toTerms(profile, id);
  if (terms.some((term) => term.detail)) {
    return (
      <ul className="mt-6 grid gap-x-10 @md:grid-cols-2">
        {terms.map((term) => (
          <li
            key={term.key}
            className="flex items-baseline justify-between gap-4 border-b border-p-line py-2.5 text-base"
          >
            <span>{term.label}</span>
            {term.detail && (
              <span className="text-right text-[13px] text-p-muted">
                {term.detail}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="mt-6 text-base leading-[1.7] text-p-fg">
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
