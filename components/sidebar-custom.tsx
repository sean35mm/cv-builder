'use client';

import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import {
  LogOut,
  Palette,
  Home,
  Menu,
  BarChart3,
  Mail,
  Layout,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  { label: 'Editor', href: '/editor', icon: Home },
  { label: 'Theme', href: '/theme', icon: Palette },
  { label: 'Templates', href: '/templates', icon: Layout },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Inbox', href: '/inbox', icon: Mail },
  { label: 'Testimonials', href: '/testimonials', icon: MessageCircle },
] as const;

function NavIcon({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={item.label}
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-md transition-colors',
            active
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-x-3 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
          )}
          <item.icon className="h-[18px] w-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const { signOut } = useAuthActions();
  const requestAccountDeletion = useMutation(
    api.deletion.requestAccountDeletion
  );
  const router = useRouter();
  const pathname = usePathname();
  const [isDeleting, setIsDeleting] = useState(false);

  if (loggedInUser === undefined || loggedInUser === null) {
    return null;
  }

  const handleSignOut = () => {
    void signOut().then(() => {
      router.push('/');
    });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Permanently delete your account and all profile data? This cannot be undone.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await requestAccountDeletion({});
      await signOut();
      router.push('/');
    } catch {
      setIsDeleting(false);
      toast.error('Failed to request account deletion');
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[72px] border-r bg-card z-20">
        <div className="flex h-full w-full flex-col items-center py-5">
          <div className="flex-1" />

          <div className="flex flex-col items-center gap-3">
            {navItems.map((item) => (
              <NavIcon
                key={item.href}
                item={item}
                active={pathname === item.href}
                onClick={() => router.push(item.href)}
              />
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex flex-col items-center gap-3">
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => void handleDeleteAccount()}
                  aria-label="Delete account"
                  disabled={isDeleting}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" sideOffset={8}>
                Delete account
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" sideOffset={8}>
                Sign out
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 border-t bg-card md:hidden">
        <div className="flex items-center justify-around py-2.5 px-4">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              aria-label={item.label}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 transition-colors',
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}

          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Menu"
                className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-muted-foreground">
                    Appearance
                  </span>
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  className="justify-start text-destructive hover:text-destructive"
                  disabled={isDeleting}
                  onClick={() => void handleDeleteAccount()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting account...' : 'Delete account'}
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
