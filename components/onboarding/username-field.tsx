'use client';

import { useQuery } from 'convex/react';
import { useEffect, useState, type ReactNode, type Ref } from 'react';
import { api } from '@/convex/_generated/api';
import {
  cleanUsernameInput,
  isValidUsername,
  USERNAME_MAX_LENGTH,
} from '@/lib/username';
import { cn } from '@/lib/utils';

export type UsernameState =
  | 'idle'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken';

export const USERNAME_RULE =
  'Use 3 to 30 lowercase letters or numbers. Hyphens and underscores can go in the middle.';

// Debounced availability. Only valid names reach the query: the server throws
// on anything else.
export function useUsernameAvailability(username: string): UsernameState {
  const [settled, setSettled] = useState(username);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(username), 300);
    return () => window.clearTimeout(timer);
  }, [username]);

  const isSettled = settled === username;
  const valid = isValidUsername(username);
  const available = useQuery(
    api.profiles.checkUsernameAvailable,
    valid && isSettled ? { username } : 'skip'
  );

  if (!username) return 'idle';
  if (!valid) return isSettled ? 'invalid' : 'idle';
  if (!isSettled || available === undefined) return 'checking';
  return available ? 'available' : 'taken';
}

type UsernameFieldProps = {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  state: UsernameState;
  statusId: string;
  size?: 'default' | 'lg';
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
  children?: ReactNode;
};

export function UsernameField({
  id,
  value,
  onValueChange,
  state,
  statusId,
  size = 'default',
  inputRef,
  autoFocus,
  children,
}: UsernameFieldProps) {
  const invalid = state === 'taken' || state === 'invalid';

  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-center rounded-md border border-input bg-surface font-mono text-base transition-[border-color,box-shadow] duration-150 ease-out hover:border-border-strong focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/15',
        invalid && 'border-destructive hover:border-destructive',
        size === 'lg' ? 'h-12 pl-3.5 pr-1.5' : 'h-10 pl-3 pr-1 sm:text-[13px]'
      )}
    >
      <span aria-hidden="true" className="shrink-0 select-none text-subtle">
        opencv.app/u/
      </span>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(event) =>
          onValueChange(cleanUsernameInput(event.target.value))
        }
        placeholder="yourname"
        maxLength={USERNAME_MAX_LENGTH}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={statusId}
        className="h-full min-w-0 flex-1 bg-transparent pr-2 text-foreground outline-none placeholder:text-subtle focus-visible:outline-none"
      />
      {children}
    </div>
  );
}

const STATE_CLASS: Record<UsernameState, string> = {
  idle: 'text-subtle',
  invalid: 'text-muted-foreground',
  checking: 'text-subtle',
  available: 'text-success',
  taken: 'text-destructive',
};

export function UsernameStatus({
  id,
  username,
  state,
  className,
}: {
  id: string;
  username: string;
  state: UsernameState;
  className?: string;
}) {
  const message = {
    idle: '',
    invalid: USERNAME_RULE,
    checking: 'Checking availability…',
    available: `opencv.app/u/${username} is available`,
    taken: `opencv.app/u/${username} is taken`,
  }[state];

  return (
    <p
      id={id}
      role="status"
      aria-live="polite"
      className={cn(
        'min-h-5 text-[13px] leading-5 transition-colors duration-150 ease-out',
        STATE_CLASS[state],
        className
      )}
    >
      {message}
    </p>
  );
}
