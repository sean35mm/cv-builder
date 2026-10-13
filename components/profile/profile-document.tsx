import type { ProfileContent, SectionsVisibility } from '@/lib/types';
import { resolveTemplateId } from '@/lib/templates';
import { paletteClassName } from '@/lib/palettes';
import { cn } from '@/lib/utils';
import { ClassicView } from '@/components/templates/classic-view';
import { ModernView } from '@/components/templates/modern-view';
import { MinimalView } from '@/components/templates/minimal-view';

export type ProfileDocumentProps = {
  profile: ProfileContent;
  templateId?: unknown;
  colorTheme?: unknown;
  sectionsVisibility?: SectionsVisibility;
  className?: string;
};

// The one renderer for a profile: the public page, the workspace preview and
// the landing specimen all use it, so what you preview is what you publish.
export function ProfileDocument({
  profile,
  templateId,
  colorTheme,
  sectionsVisibility,
  className,
}: ProfileDocumentProps) {
  const id = resolveTemplateId(templateId);
  const View =
    id === 'modern' ? ModernView : id === 'minimal' ? MinimalView : ClassicView;

  return (
    <div
      className={cn(paletteClassName(colorTheme), 'bg-p-bg text-p-fg', className)}
      data-template={id}
    >
      <View profile={profile} sectionsVisibility={sectionsVisibility} />
    </div>
  );
}
