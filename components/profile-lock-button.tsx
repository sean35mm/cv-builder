'use client';

import { useRouter } from 'next/navigation';

export function ProfileLockButton() {
  const router = useRouter();
  const lock = async () => {
    const response = await fetch('/api/profile-access/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (response.ok) router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void lock()}
      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      Lock profile
    </button>
  );
}
