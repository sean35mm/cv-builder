'use client';

import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import {
  Activity,
  Compass,
  LogOut,
  Palette,
  Home,
  Menu,
  Send,
  Trash2,
  UserRound,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BrandLockup } from '@/components/platform/brand-lockup';

const navItems = [
  { label: 'Home', href: '/home', icon: Home, relatedRoutes: [] },
  { label: 'Profile', href: '/editor', icon: UserRound, relatedRoutes: [] },
  {
    label: 'Appearance',
    href: '/appearance',
    icon: Palette,
    relatedRoutes: ['/theme', '/templates'],
  },
  {
    label: 'Publish',
    href: '/publish',
    icon: Send,
    relatedRoutes: ['/domains'],
  },
  {
    label: 'Activity',
    href: '/activity',
    icon: Activity,
    relatedRoutes: ['/analytics', '/inbox', '/testimonials'],
  },
  {
    label: 'Explore',
    href: '/directory',
    icon: Compass,
    relatedRoutes: [],
  },
] as const;

const isActiveRoute = (
  pathname: string | null,
  item: (typeof navItems)[number]
) =>
  [item.href, ...item.relatedRoutes].some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

export function Sidebar() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const { signOut } = useAuthActions();
  const requestAccountDeletion = useMutation(
    api.deletion.requestAccountDeletion
  );
  const router = useRouter();
  const pathname = usePathname();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMoreActive = navItems
    .slice(4)
    .some((item) => isActiveRoute(pathname, item));

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
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-border bg-background text-foreground">
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 md:px-6">
          <BrandLockup href="/home" compact />

          <nav
            className="hidden min-w-0 justify-center md:flex"
            aria-label="Workspace"
          >
            <ul className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = isActiveRoute(pathname, item);

                return (
                  <li key={item.href}>
                    <button
                      onClick={() => router.push(item.href)}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition-colors duration-150 after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                        isActive
                          ? 'text-foreground after:bg-accent'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <item.icon className="size-4" aria-hidden="true" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden gap-2 px-3 md:inline-flex"
                  aria-label="Open account menu"
                >
                  <UserRound className="size-4" aria-hidden="true" />
                  <span className="hidden xl:inline">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isDeleting}
                  onSelect={() => void handleDeleteAccount()}
                >
                  <Trash2 aria-hidden="true" />
                  {isDeleting ? 'Deleting…' : 'Delete account'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Mobile workspace"
      >
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              aria-label={item.label}
              aria-current={isActiveRoute(pathname, item) ? 'page' : undefined}
              className={cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-none px-1 text-[10px] font-medium transition-colors duration-150 before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                isActiveRoute(pathname, item)
                  ? 'text-foreground before:bg-accent'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Menu"
                className={cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-none px-1 text-[10px] font-medium transition-colors before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  isMoreActive
                    ? 'text-foreground before:bg-accent'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Menu className="size-4" aria-hidden="true" />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
              <SheetTitle className="font-display text-2xl">More</SheetTitle>
              <div className="flex flex-col gap-2 py-4">
                {navItems.slice(4).map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      'min-h-11 justify-start rounded',
                      isActiveRoute(pathname, item) &&
                        'bg-secondary text-foreground'
                    )}
                    aria-current={
                      isActiveRoute(pathname, item) ? 'page' : undefined
                    }
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Button>
                ))}
                <div className="flex min-h-11 items-center justify-between px-1">
                  <span className="text-sm text-muted-foreground">
                    Appearance
                  </span>
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  className="min-h-11 justify-start text-destructive hover:text-destructive"
                  disabled={isDeleting}
                  onClick={() => void handleDeleteAccount()}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isDeleting ? 'Deleting account...' : 'Delete account'}
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11 justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
