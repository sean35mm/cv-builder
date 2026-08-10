import { displayUrl, normalizeExternalUrl } from '@/lib/profile-format';
import {
  LANGUAGE_PROFICIENCY_LABELS,
  type ProfileContent,
} from '@/lib/profile/domain';

type AdditionalSectionId = 'languages' | 'publications' | 'interests';

const titles: Record<AdditionalSectionId, string> = {
  languages: 'Languages',
  publications: 'Publications',
  interests: 'Interests',
};

export function AdditionalProfileSection({
  id,
  profile,
  className = 'mb-8',
  headingClassName = 'mb-4 text-lg font-semibold text-foreground',
}: {
  id: AdditionalSectionId;
  profile: ProfileContent;
  className?: string;
  headingClassName?: string;
}) {
  if (id === 'languages') {
    return (
      <section className={className} aria-labelledby="profile-languages">
        <h2 id="profile-languages" className={headingClassName}>
          {titles[id]}
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {profile.languages.map((language) => (
            <div
              key={language.id}
              className="flex items-baseline justify-between gap-4 rounded-xl bg-muted/60 px-4 py-3"
            >
              <dt className="font-medium text-foreground">{language.name}</dt>
              {language.proficiency && (
                <dd className="text-sm text-muted-foreground">
                  {LANGUAGE_PROFICIENCY_LABELS[language.proficiency]}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </section>
    );
  }

  if (id === 'publications') {
    return (
      <section className={className} aria-labelledby="profile-publications">
        <h2 id="profile-publications" className={headingClassName}>
          {titles[id]}
        </h2>
        <ol className="grid gap-3">
          {profile.publications.map((publication) => {
            const url = normalizeExternalUrl(publication.url);
            return (
              <li key={publication.id} className="rounded-2xl bg-muted/60 p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3 className="font-medium text-foreground">
                    {publication.title}
                  </h3>
                  {publication.date && (
                    <time className="text-sm text-muted-foreground">
                      {publication.date}
                    </time>
                  )}
                </div>
                {(publication.publisher || publication.authors?.length) && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[publication.authors?.join(', '), publication.publisher]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {publication.description && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/80">
                    {publication.description}
                  </p>
                )}
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block break-all text-sm text-primary underline underline-offset-4"
                  >
                    {displayUrl(publication.url)}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  return (
    <section className={className} aria-labelledby="profile-interests">
      <h2 id="profile-interests" className={headingClassName}>
        {titles[id]}
      </h2>
      <ul className="flex flex-wrap gap-2 text-foreground/80">
        {profile.interests.map((interest) => (
          <li
            key={interest}
            className="rounded-full bg-muted px-4 py-2 text-sm"
          >
            {interest}
          </li>
        ))}
      </ul>
    </section>
  );
}
