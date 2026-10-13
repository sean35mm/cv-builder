'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ProfileShareDialog({
  username,
  canonicalUrl,
  trigger,
}: {
  username: string;
  canonicalUrl: string;
  /** Replaces the default outline button, e.g. on the public profile page. */
  trigger?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const qrBase = `/api/profile-share/qr?username=${encodeURIComponent(username)}`;
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            <Share2 aria-hidden="true" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="gap-5 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share profile</DialogTitle>
          <DialogDescription>
            Anyone with the link can open this profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <label htmlFor="profile-share-url" className="sr-only">
            Profile URL
          </label>
          <Input
            id="profile-share-url"
            readOnly
            value={canonicalUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="min-w-0 flex-1 font-mono text-[12.5px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyUrl()}
            className="w-[5.5rem]"
          >
            {copied ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="sr-only" aria-live="polite">
          {copied ? 'Link copied' : ''}
        </p>

        <div className="flex items-center gap-4 border-t border-border pt-5">
          <img
            src={`${qrBase}&format=svg`}
            alt={`QR code for ${canonicalUrl}`}
            width={112}
            height={112}
            className="size-28 shrink-0 rounded-md border border-border bg-white p-2"
          />
          <div className="min-w-0 space-y-2">
            <p className="text-[13px] leading-5 text-muted-foreground">
              QR code for print or slides. It encodes only the profile link.
            </p>
            <div className="flex gap-3 text-[13px]">
              <a
                href={`${qrBase}&format=svg&download=1`}
                download
                className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
              >
                Download SVG
              </a>
              <a
                href={`${qrBase}&format=png&download=1`}
                download
                className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
              >
                Download PNG
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
