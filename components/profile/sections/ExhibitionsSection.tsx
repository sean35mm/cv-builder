import type { ProfileContent } from '@/lib/types';
import { displayUrl } from '@/lib/profile-format';

export function ExhibitionsSection({ profile }: { profile: ProfileContent }) {
  if (!Array.isArray(profile.exhibitions) || profile.exhibitions.length === 0) {
    return null;
  }
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Exhibitions
      </h2>
      <div className="space-y-6">
        {profile.exhibitions.map((e) => (
          <div key={`exh:${e.id}`}>
            <div className="flex items-baseline gap-3">
              <h3 className="font-medium text-foreground">{e.title}</h3>
              <span className="text-sm text-muted-foreground">{e.year}</span>
            </div>
            {(e.venue || e.location) && (
              <p className="text-muted-foreground mb-1">
                {[e.venue, e.location].filter(Boolean).join(' — ')}
              </p>
            )}
            {(e.link || undefined) && (
              <a
                href={e.link?.startsWith('http') ? e.link : `https://${e.link}`}
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
  );
}
