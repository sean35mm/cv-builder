import type { ProfileContent, SectionsVisibility } from '@/lib/types';
import { resolveTemplateId } from '@/lib/templates';
import { paletteClassName } from '@/lib/palettes';
import { cn } from '@/lib/utils';
import { ClassicView } from '@/components/templates/classic-view';
import { ModernView } from '@/components/templates/modern-view';
import { MinimalView } from '@/components/templates/minimal-view';
import type { ProfileTestimonial } from '@/components/templates/parts';

export type ProfileDocumentProps = {
  profile: ProfileContent;
  templateId?: unknown;
  colorTheme?: unknown;
  sectionsVisibility?: SectionsVisibility;
  testimonials?: ProfileTestimonial[];
  className?: string;
};

const VIEWS = {
  classic: ClassicView,
  modern: ModernView,
  minimal: MinimalView,
};

// The one renderer for a profile: the public page, the workspace preview and
// the landing specimen all use it, so what you preview is what you publish.
// Layout responds to this element's width (@container), never the viewport,
// so it renders the same inside a scaled preview frame.
export function ProfileDocument({
  profile,
  templateId,
  colorTheme,
  sectionsVisibility,
  testimonials,
  className,
}: ProfileDocumentProps) {
  const id = resolveTemplateId(templateId);
  const View = VIEWS[id];

  return (
    <div
      className={cn(
        paletteClassName(colorTheme),
        '@container bg-p-bg font-sans text-p-fg [overflow-wrap:anywhere]',
        className
      )}
      data-template={id}
    >
      <View
        profile={profile}
        sectionsVisibility={sectionsVisibility}
        testimonials={testimonials}
      />
    </div>
  );
}
