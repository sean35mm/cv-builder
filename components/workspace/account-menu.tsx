'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { FileUp, LogOut, Monitor, Moon, Sun, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/convex/_generated/api';

export function AccountMenu({
  email,
  name,
  onImportLinkedIn,
  confirmLeave,
  afterDeleteRequested,
}: {
  email?: string;
  name: string;
  onImportLinkedIn: () => void;
  confirmLeave: () => Promise<boolean>;
  afterDeleteRequested: () => void;
}) {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const requestAccountDeletion = useMutation(
    api.deletion.requestAccountDeletion
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const initial = (email || name || '?').trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    if (!(await confirmLeave())) return;
    await signOut();
    router.replace('/login');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await requestAccountDeletion({});
      afterDeleteRequested();
      await signOut();
      router.replace('/');
    } catch {
      setDeleting(false);
      toast.error("Couldn't delete your account. Try again.");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Account"
            className="rounded-full"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground ring-1 ring-border">
              {initial}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {email && (
            <DropdownMenuLabel className="truncate text-[12px] font-normal text-muted-foreground">
              {email}
            </DropdownMenuLabel>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11.5px] font-normal text-subtle">
            Theme
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <Sun aria-hidden="true" /> Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon aria-hidden="true" /> Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor aria-hidden="true" /> System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onImportLinkedIn}>
            <FileUp aria-hidden="true" />
            Import from LinkedIn…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void handleSignOut()}>
            <LogOut aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete account…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={deleteOpen}
        onOpenChange={(next) => !deleting && setDeleteOpen(next)}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your profile, uploads, and account are permanently deleted. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
