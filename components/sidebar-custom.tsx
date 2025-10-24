'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LogOut, Palette, Home } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
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
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-[75px] border-r bg-card p-4 z-20">
      <div className="flex h-full flex-col items-center w-full">
        {/* Spacer to center the group */}
        <div className="flex-1" />

        {/* Center section: grouped navigation */}
        <div className="flex flex-col items-center gap-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => router.push('/editor')}
                aria-label="Home"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-5 h-5 text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={8}>
              Home
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => router.push('/theme')}
                aria-label="Theme settings"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Palette className="w-5 h-5 text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={8}>
              Theme
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Spacer to push controls to bottom */}
        <div className="flex-1" />

        {/* Bottom section: Mode + Logout */}
        <div className="flex flex-col items-center gap-6">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-5 h-5 text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={8}>
              Logout
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
