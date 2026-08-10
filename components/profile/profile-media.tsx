import { cn } from '@/lib/utils';

export function ProfileAvatar({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={`${name} profile portrait`}
      width={128}
      height={128}
      className={cn(
        'h-20 w-20 shrink-0 rounded-full object-cover shadow-sm sm:h-24 sm:w-24',
        className
      )}
    />
  );
}

export function EntryMediaGrid({
  images,
  title,
  className,
}: {
  images?: string[];
  title: string;
  className?: string;
}) {
  if (!images?.length) return null;
  return (
    <div
      className={cn(
        'mt-4 grid max-w-2xl grid-cols-1 gap-2 overflow-hidden sm:grid-cols-3',
        images.length === 2 && 'grid-cols-2 sm:grid-cols-2',
        className
      )}
    >
      {images.slice(0, 3).map((image, index) => (
        <img
          key={image}
          src={image}
          alt={`${title} image ${index + 1}`}
          width={480}
          height={320}
          loading="lazy"
          className="aspect-[3/2] h-auto w-full rounded-xl object-cover"
        />
      ))}
    </div>
  );
}
