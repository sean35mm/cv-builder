'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LogOut } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (loggedInUser === undefined || loggedInUser === null) {
    return null;
  }

  const handleSignOut = () => {
    void signOut().then(() => {
      router.push('/');
    });
  };

  return (
    <aside className="hidden md:flex w-[75px] shrink-0 border-r bg-card p-4">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex-1" />
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
