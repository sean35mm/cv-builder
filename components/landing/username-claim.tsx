'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';

type Props = { onClaim: () => void };

function normalize(raw: string) {
  const v = raw.replace(/^@+/, '').toLowerCase();
  return v.replace(/[^a-z0-9_]/g, '').slice(0, 15);
}

function isValid(u: string) {
  return /^[a-z0-9_]{3,15}$/.test(u);
}

export function UsernameClaim({ onClaim }: Props) {
  const [raw, setRaw] = useState('');
  const username = useMemo(() => normalize(raw), [raw]);
  const valid = isValid(username);
  const hasInvalidChars = raw.length > 0 && raw !== username;
  const availability = useQuery(
    api.profiles.checkUsernameAvailable,
    valid && !hasInvalidChars ? { username } : 'skip'
  );

  const status = hasInvalidChars
    ? 'invalid'
    : !valid || username.length < 3
      ? 'idle'
      : availability === undefined
        ? 'loading'
        : availability
          ? 'available'
          : 'taken';

  return (
    <div className="w-full max-w-lg">
      <label htmlFor="landing-username" className="platform-kicker mb-2 block text-muted-foreground">
        Claim your public address
      </label>
      <div className="border bg-card p-1">
        <div className="flex min-w-0 items-center gap-1">
          <span className="hidden min-h-11 shrink-0 items-center border-r px-3 font-mono text-xs tracking-wide text-muted-foreground sm:flex">
            opencv.app/@
          </span>
          <Input
            id="landing-username"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="username"
            maxLength={15}
            className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            aria-label="Desired username"
          />
          <Button
            size="sm"
            className="min-h-11 shrink-0 px-4"
            disabled={status !== 'available'}
            onClick={() => {
              if (status === 'available') {
                try {
                  sessionStorage.setItem('desiredUsername', username);
                } catch {
                  /* noop */
                }
                onClaim();
              }
            }}
          >
            {status === 'available' ? `Claim @${username}` : 'Claim'}
          </Button>
        </div>
      </div>

      <div className="mt-3 min-h-5 text-sm" aria-live="polite">
        {status === 'loading' && (
          <span className="text-muted-foreground">Checking...</span>
        )}
        {status === 'available' && (
          <span className="font-medium text-primary">
            @{username} is available
          </span>
        )}
        {status === 'taken' && (
          <span className="font-medium text-destructive">
            @{username} is taken
          </span>
        )}
        {status === 'invalid' && (
          <span className="text-destructive">
            Only lowercase letters, numbers, and underscores allowed.
          </span>
        )}
        {status === 'idle' && username.length > 0 && (
          <span className="text-muted-foreground">
            3-15 characters: lowercase letters, numbers, or underscores.
          </span>
        )}
      </div>
    </div>
  );
}
