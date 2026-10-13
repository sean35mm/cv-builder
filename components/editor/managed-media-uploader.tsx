'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  canonicalizeManagedMediaUrl,
  parseManagedMediaUrl,
} from '@/lib/profile/media';
import {
  MAX_PROJECT_IMAGE_SIZE_BYTES,
  normalizeSafeRasterContentType,
} from '@/lib/profile/raster-image-policy';
import { cn } from '@/lib/utils';

export function ManagedMediaUploader({
  images,
  label,
  maxImages,
  onChange,
  subject,
  avatar = false,
}: {
  images: string[];
  label: string;
  maxImages: number;
  // Receives an updater so results that arrive later apply to the form's
  // current images, not the ones shown when the upload started.
  onChange: (update: (current: string[]) => string[]) => void;
  subject: string;
  avatar?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File) => {
    if (images.length >= maxImages) return;
    const contentType = normalizeSafeRasterContentType(file.type);
    if (!contentType) {
      toast.error('Choose a JPEG, PNG, WebP, GIF, or AVIF image');
      return;
    }
    if (file.size > MAX_PROJECT_IMAGE_SIZE_BYTES) {
      toast.error('Images must be 5 MB or smaller');
      return;
    }

    setIsUploading(true);
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch('/api/uploads/images', {
        method: 'POST',
        headers: {
          'X-Upload-Content-Type': contentType,
          'X-Upload-Size': String(file.size),
        },
        body,
      });
      if (!response.ok) throw new Error('Upload failed');
      const result: unknown = await response.json();
      if (
        typeof result !== 'object' ||
        result === null ||
        !('url' in result) ||
        typeof result.url !== 'string' ||
        !parseManagedMediaUrl(result.url)?.previewToken
      ) {
        throw new Error('Upload failed');
      }
      const url = result.url;
      onChange((current) =>
        current.length >= maxImages ? current : [...current, url]
      );
    } catch {
      toast.error("Couldn't upload the image. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    // Compare canonically: a saved upload's token URL may have just been
    // swapped for its canonical form.
    const canonical = (image: string) =>
      canonicalizeManagedMediaUrl(image) ?? image;
    const removed = canonical(images[index]);
    onChange((current) =>
      current.filter((image) => canonical(image) !== removed)
    );
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[12.5px] leading-none font-medium text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {images.map((image, index) => (
          <div
            key={image}
            className={cn(
              'group/image relative size-16 overflow-hidden border border-border bg-secondary',
              avatar ? 'rounded-full' : 'rounded-md'
            )}
          >
            <img
              src={image}
              alt={`${subject} image ${index + 1}`}
              width={64}
              height={64}
              loading="lazy"
              className="size-full object-cover"
            />
            <button
              type="button"
              aria-label={`Remove ${subject} image ${index + 1}`}
              onClick={() => removeImage(index)}
              className={cn(
                'absolute flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity duration-150 ease-out group-hover/image:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100',
                avatar ? 'top-0 right-0' : 'top-1 right-1'
              )}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <label
            aria-busy={isUploading}
            className={cn(
              'flex size-16 cursor-pointer items-center justify-center border border-dashed border-border-strong text-subtle transition-colors duration-150 ease-out hover:bg-secondary hover:text-muted-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
              avatar ? 'rounded-full' : 'rounded-md',
              isUploading && 'pointer-events-none'
            )}
          >
            <input
              type="file"
              accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
              aria-label={`Upload an image for ${subject}`}
              className="sr-only"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
                event.target.value = '';
              }}
            />
            {isUploading ? (
              <span className="font-mono text-[11px]" role="status">
                Uploading
              </span>
            ) : (
              <>
                <Plus className="size-4" aria-hidden="true" />
                <span className="sr-only">Choose image</span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}
