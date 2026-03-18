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
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-lg border bg-card p-1.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded bg-muted px-2.5 py-2 text-xs font-mono tracking-widest text-muted-foreground">
            opencv.app/@
          </span>
          <Input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="username"
            maxLength={15}
            className="h-9 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            aria-label="Desired username"
          />
          <Button
            size="sm"
            className="shrink-0 px-4"
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

      <div className="mt-3 h-5 text-center text-sm">
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
