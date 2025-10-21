import type { ProfileContent } from '@/lib/types';
import { formatRange } from '@/lib/profile-format';

export function VolunteeringSection({ profile }: { profile: ProfileContent }) {
  if (
    !Array.isArray(profile.volunteering) ||
    profile.volunteering.length === 0
  ) {
    return null;
  }
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Volunteering
      </h2>
      <div className="space-y-6">
        {profile.volunteering.map((v) => (
          <div
            key={`vol:${v.id}`}
            className="grid grid-cols-[160px_1fr] gap-x-8"
          >
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {formatRange(v.startDate, v.endDate, v.current)}
            </div>
            <div>
              <h3 className="font-medium text-foreground">{v.role}</h3>
              <p className="text-muted-foreground mb-2">{v.organization}</p>
              {v.description && (
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {v.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
