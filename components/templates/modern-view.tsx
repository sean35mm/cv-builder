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

// Rail: identity pinned in a left rail beside the work. The rail becomes a
// plain header when the container is narrower than 48rem.
export function ModernView({ profile, sectionsVisibility }: TemplateProps) {
  const showHeader = isVisible(profile, sectionsVisibility, 'header');
  const links = isVisible(profile, sectionsVisibility, 'contact')
    ? contactLinks(profile)
    : [];
  const skills = isVisible(profile, sectionsVisibility, 'skills')
    ? toTerms(profile, 'skills')
    : [];
  const location = showHeader ? profile.location?.trim() : undefined;
  const sections = bodySections(profile, sectionsVisibility, ['skills']);

  return (
    <div className="@container">
      <div className="mx-auto grid w-full max-w-[72rem] gap-12 px-5 py-10 @lg:px-8 @3xl:grid-cols-[14.5rem_minmax(0,1fr)] @3xl:gap-16 @3xl:px-10 @3xl:py-16 print:block print:p-0">
        <header className="min-w-0 @3xl:sticky @3xl:top-10 @3xl:self-start print:static">
          {showHeader ? (
            <>
              <Avatar profile={profile} className="mb-5 size-16 rounded-full" />
              <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-p-fg @3xl:text-[1.375rem]">
                {profile.name}
              </h1>
              {profile.title && (
                <p className="mt-1.5 text-[15px] leading-snug text-p-muted">
                  {profile.title}
                </p>
              )}
              {location && (
                <p className="mt-3 text-[13px] text-p-muted">{location}</p>
              )}
            </>
          ) : (
            <HiddenHeading profile={profile} />
          )}
          {links.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-5 text-p-fg @3xl:mt-6 @3xl:block @3xl:space-y-1.5">
              {links.map((item) => (
                <li key={item.key}>
                  <ContactAnchor item={item} />
                </li>
              ))}
            </ul>
          )}
          {skills.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[12px] font-medium text-p-muted">
                {SECTION_TITLES.skills}
              </h2>
              <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] leading-5 text-p-fg">
                {skills.map((term) => (
                  <li key={term.key}>{term.label}</li>
                ))}
              </ul>
            </section>
          )}
        </header>

        {sections.length > 0 && (
          <div className="min-w-0 space-y-14 @3xl:space-y-16">
            {sections.map((id) => (
              <ModernSection key={id} id={id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModernSection({
  id,
  profile,
}: {
  id: SectionId;
  profile: ProfileContent;
}) {
  return (
    <section>
      <h2 className="mb-5 text-[13px] font-medium text-p-muted">
        {SECTION_TITLES[id]}
      </h2>
      {id === 'bio' && (
        <p className="max-w-[65ch] whitespace-pre-line text-base leading-[1.65] text-p-fg">
          {profile.bio}
        </p>
      )}
      {id === 'projects' && <ModernProjects entries={toEntries(profile, id)} />}
      {isEntrySection(id) && id !== 'projects' && (
        <ol className="divide-y divide-p-line">
          {toEntries(profile, id).map((entry) => (
            <ModernEntry key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
      {isTermSection(id) && <ModernTerms id={id} profile={profile} />}
    </section>
  );
}

function EntryFooter({ entry }: { entry: Entry }) {
  if (entry.tags.length === 0 && !entry.href) return null;
  return (
    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      {entry.tags.length > 0 && (
        <ul
          className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[12px] text-p-muted"
          aria-label="Built with"
        >
          {entry.tags.map((tag, index) => (
            <li key={`${index}-${tag}`}>{tag}</li>
          ))}
        </ul>
      )}
      {entry.href && (
        <ExternalLink href={entry.href} className="text-[13px] text-p-fg">
          {entry.linkText}
        </ExternalLink>
      )}
    </div>
  );
}

function ModernEntry({ entry }: { entry: Entry }) {
  return (
    <li className="grid gap-x-6 gap-y-1 py-5 break-inside-avoid first:pt-0 last:pb-0 @xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <h3 className="text-[15px] font-medium leading-snug text-p-fg">
          {entry.title}
        </h3>
        {entry.subtitle && (
          <p className="text-[14px] text-p-muted">{entry.subtitle}</p>
        )}
      </div>
      {hasDates(entry) && (
        <p className="text-[13px] tabular-nums text-p-muted @xl:text-right">
          <DateRange entry={entry} />
        </p>
      )}
      {(entry.description ||
        entry.images.length > 0 ||
        entry.tags.length > 0 ||
        entry.href) && (
        <div className="min-w-0 @xl:col-span-2">
          {entry.description && (
            <p className="mt-1 max-w-[65ch] whitespace-pre-line text-[14.5px] leading-[1.65] text-p-muted">
              {entry.description}
            </p>
          )}
          {entry.images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 @xl:grid-cols-4">
              {entry.images.map((src, index) => (
                <EntryImage
                  key={`${index}-${src}`}
                  entry={entry}
                  index={index}
                  className="aspect-[4/3] rounded-md border border-p-line"
                />
              ))}
            </div>
          )}
          <EntryFooter entry={entry} />
        </div>
      )}
    </li>
  );
}

function ModernProjects({ entries }: { entries: Entry[] }) {
  return (
    <ul
      className={cn(
        'grid gap-x-6 gap-y-10',
        entries.length > 1 && '@xl:grid-cols-2'
      )}
    >
      {entries.map((entry, entryIndex) => (
        <li
          key={entry.id}
          className={cn(
            'min-w-0 break-inside-avoid',
            entry.featured && entries.length > 1 && '@xl:col-span-2'
          )}
        >
          {entry.images.length > 0 && (
            <div className="mb-4 space-y-2">
              <EntryImage
                entry={entry}
                index={0}
                eager={entryIndex === 0}
                className={cn(
                  'rounded-md border border-p-line',
                  entry.featured ? 'aspect-[2/1]' : 'aspect-[16/10]'
                )}
              />
              {entry.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {entry.images.slice(1).map((src, index) => (
                    <EntryImage
                      key={`${index}-${src}`}
                      entry={entry}
                      index={index + 1}
                      className="aspect-[4/3] rounded-[4px] border border-p-line"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="min-w-0 text-[15px] font-medium leading-snug text-p-fg">
              {entry.title}
            </h3>
            {hasDates(entry) && (
              <p className="shrink-0 text-[13px] tabular-nums text-p-muted">
                <DateRange entry={entry} />
              </p>
            )}
          </div>
          {entry.subtitle && (
            <p className="text-[14px] text-p-muted">{entry.subtitle}</p>
          )}
          {entry.description && (
            <p className="mt-2 max-w-[65ch] whitespace-pre-line text-[14.5px] leading-[1.65] text-p-muted">
              {entry.description}
            </p>
          )}
          <EntryFooter entry={entry} />
        </li>
      ))}
    </ul>
  );
}

function ModernTerms({
  id,
  profile,
}: {
  id: 'skills' | 'languages' | 'interests';
  profile: ProfileContent;
}) {
  const terms = toTerms(profile, id);
  if (terms.some((term) => term.detail)) {
    return (
      <ul className="grid gap-x-8 @xl:grid-cols-2">
        {terms.map((term) => (
          <li
            key={term.key}
            className="flex items-baseline justify-between gap-4 border-b border-p-line py-2.5"
          >
            <span className="text-[14.5px] text-p-fg">{term.label}</span>
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
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[14.5px] text-p-fg">
      {terms.map((term) => (
        <li key={term.key}>{term.label}</li>
      ))}
    </ul>
  );
}
