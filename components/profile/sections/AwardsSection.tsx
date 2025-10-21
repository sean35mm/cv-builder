import type { ProfileContent } from '@/lib/types';
import { displayUrl } from '@/lib/profile-format';

export function AwardsSection({ profile }: { profile: ProfileContent }) {
  if (!Array.isArray(profile.awards) || profile.awards.length === 0) {
    return null;
  }
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Awards</h2>
      <div className="space-y-6">
        {profile.awards.map((a) => (
          <div key={`awd:${a.id}`}>
            <div className="flex items-baseline gap-3">
              <h3 className="font-medium text-foreground">{a.title}</h3>
              <span className="text-sm text-muted-foreground">{a.year}</span>
            </div>
            <p className="text-muted-foreground mb-1">{a.issuer}</p>
            {(a.link || undefined) && (
              <a
                href={a.link?.startsWith('http') ? a.link : `https://${a.link}`}
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
  );
}
