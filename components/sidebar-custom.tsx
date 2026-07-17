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
  Globe2,
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BrandLockup } from '@/components/platform/brand-lockup';

const navItems = [
  { label: 'Editor', href: '/editor', icon: Home },
  { label: 'Theme', href: '/theme', icon: Palette },
  { label: 'Templates', href: '/templates', icon: Layout },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Inbox', href: '/inbox', icon: Mail },
  { label: 'Testimonials', href: '/testimonials', icon: MessageCircle },
  { label: 'Domains', href: '/domains', icon: Globe2 },
] as const;

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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r bg-sidebar md:flex">
        <div className="flex h-full w-full flex-col px-5 py-6">
          <BrandLockup href="/editor" />
          <p className="platform-kicker mt-12 border-b pb-3 text-muted-foreground">
            Workspace index
          </p>
          <nav className="mt-2" aria-label="Workspace">
            <ol>
            {navItems.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => router.push(item.href)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(
                    'group flex min-h-11 w-full items-center gap-3 border-b text-left text-sm transition-colors duration-200',
                    pathname === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="w-5 font-mono text-[10px] tabular-nums">
                    {String(navItems.indexOf(item) + 1).padStart(2, '0')}
                  </span>
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <span aria-hidden="true">{pathname === item.href ? '●' : '→'}</span>
                </button>
              </li>
            ))}
            </ol>
          </nav>

          <div className="mt-auto border-t pt-4">
            <div className="mb-3 flex min-h-11 items-center justify-between text-xs text-muted-foreground">
              <span>Reading edition</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleSignOut}
              className="flex min-h-11 w-full items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <button
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
              className="flex min-h-11 w-full items-center gap-3 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card md:hidden" aria-label="Mobile workspace">
        <div className="grid grid-cols-5 px-1">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              aria-label={item.label}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] transition-colors duration-200',
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}

          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Menu"
                className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] text-muted-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-none border-t p-5">
              <SheetTitle className="font-serif text-2xl font-normal">Workspace index</SheetTitle>
              <div className="flex flex-col gap-2 py-4">
                {navItems.slice(4).map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="min-h-11 justify-start border-b"
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
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
      </nav>
    </>
  );
}
