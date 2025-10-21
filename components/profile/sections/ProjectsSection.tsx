import type { ProfileContent } from '@/lib/types';
import { displayUrl } from '@/lib/profile-format';

export function ProjectsSection({ profile }: { profile: ProfileContent }) {
  if (!Array.isArray(profile.projects) || profile.projects.length === 0) {
    return null;
  }
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Projects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profile.projects.map((p) => (
          <div key={`proj:${p.id}`} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground">{p.title}</h3>
              {p.year && (
                <span className="text-xs text-muted-foreground">{p.year}</span>
              )}
            </div>
            {p.company && (
              <p className="text-muted-foreground text-sm mb-1">{p.company}</p>
            )}
            {(p.link || undefined) && (
              <a
                href={p.link?.startsWith('http') ? p.link : `https://${p.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary break-words"
              >
                {displayUrl(p.link)}
              </a>
            )}
            {p.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                {p.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
