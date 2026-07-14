'use client';

import { useState } from 'react';

type ProjectImageGalleryProps = {
  title: string;
  images: string[];
  eagerImage?: boolean;
};

export function ProjectImageGallery({
  title,
  images,
  eagerImage = false,
}: ProjectImageGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <>
      <img
        src={images[currentImage]}
        alt={`${title}, image ${currentImage + 1} of ${images.length}`}
        width={1200}
        height={675}
        loading={eagerImage && currentImage === 0 ? 'eager' : 'lazy'}
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentImage(index)}
              aria-label={`Show image ${index + 1} of ${images.length} for ${title}`}
              aria-pressed={index === currentImage}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImage
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
