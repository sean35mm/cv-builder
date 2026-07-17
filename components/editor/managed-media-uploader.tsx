'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { parseManagedMediaUrl } from '@/lib/profile/media';
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
  onChange: (images: string[]) => void;
  subject: string;
  avatar?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File) => {
    if (images.length >= maxImages) return;
    const contentType = normalizeSafeRasterContentType(file.type);
    if (!contentType) {
      toast.error('Choose a JPEG, PNG, WebP, GIF, or AVIF image.');
      return;
    }
    if (file.size > MAX_PROJECT_IMAGE_SIZE_BYTES) {
      toast.error('Images must be 5MB or smaller.');
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
      onChange([...images, result.url]);
      toast.success('Image uploaded.');
    } catch {
      toast.error('Could not upload image. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, imageIndex) => imageIndex !== index));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {images.map((image, index) => (
          <div
            key={image}
            className={cn(
              'relative h-20 w-20 overflow-hidden border bg-muted',
              avatar ? 'rounded-full' : 'rounded-md'
            )}
          >
            <img
              src={image}
              alt={`${subject} image ${index + 1}`}
              width={80}
              height={80}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label={`Remove ${subject} image ${index + 1}`}
              onClick={() => removeImage(index)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <label
            aria-busy={isUploading}
            className={cn(
              'flex h-20 w-20 cursor-pointer items-center justify-center border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-muted-foreground/50 focus-within:ring-2 focus-within:ring-ring',
              avatar ? 'rounded-full' : 'rounded-md',
              isUploading && 'opacity-50'
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
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
                <span className="sr-only">Uploading image</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">Choose image</span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}
