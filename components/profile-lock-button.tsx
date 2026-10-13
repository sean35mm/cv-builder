'use client';

import { useRouter } from 'next/navigation';

export function ProfileLockButton({ className }: { className?: string }) {
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
    <button type="button" onClick={() => void lock()} className={className}>
      Lock profile
    </button>
  );
}
