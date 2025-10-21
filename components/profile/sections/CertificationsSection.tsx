import type { ProfileContent } from '@/lib/types';
import { displayUrl } from '@/lib/profile-format';

export function CertificationsSection({
  profile,
}: {
  profile: ProfileContent;
}) {
  if (
    !Array.isArray(profile.certifications) ||
    profile.certifications.length === 0
  ) {
    return null;
  }
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Certifications
      </h2>
      <div className="space-y-6">
        {profile.certifications.map((c) => (
          <div key={`cert:${c.id}`}>
            <div className="flex items-baseline gap-3">
              <h3 className="font-medium text-foreground">{c.name}</h3>
              {c.year && (
                <span className="text-sm text-muted-foreground">{c.year}</span>
              )}
            </div>
            <p className="text-muted-foreground mb-1">{c.issuer}</p>
            {(c.link || undefined) && (
              <a
                href={c.link?.startsWith('http') ? c.link : `https://${c.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary"
              >
                {displayUrl(c.link)}
              </a>
            )}
            {c.credentialId && (
              <p className="text-xs text-muted-foreground mt-1">
                Credential ID: {c.credentialId}
              </p>
            )}
            {c.description && (
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mt-1">
                {c.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
