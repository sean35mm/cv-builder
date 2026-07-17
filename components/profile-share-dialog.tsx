'use client';

import { Check, Copy, QrCode, Share2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ProfileShareDialog({
  username,
  canonicalUrl,
}: {
  username: string;
  canonicalUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const qrPath = `/api/profile-share/qr?username=${encodeURIComponent(username)}&format=svg`;
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
        <button className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <label htmlFor="profile-share-url" className="text-sm font-medium">
              Profile URL
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="profile-share-url"
                readOnly
                value={canonicalUrl}
                className="min-h-11 min-w-0 flex-1 rounded-[2px] border border-input bg-muted px-3 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyUrl()}
                aria-label="Copy profile URL"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="border bg-white p-3">
              <img
                src={qrPath}
                alt={`QR code for ${username}'s profile`}
                width={224}
                height={224}
              />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <QrCode className="h-3.5 w-3.5" /> Encodes only the ordinary
              profile URL.
            </p>
            <div className="flex gap-2">
              <Button asChild type="button" variant="outline" size="sm">
                <a href={`${qrPath}&download=1`} download>
                  Download SVG
                </a>
              </Button>
              <Button asChild type="button" variant="outline" size="sm">
                <a
                  href={`/api/profile-share/qr?username=${encodeURIComponent(username)}&format=png&download=1`}
                  download
                >
                  Download PNG
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
