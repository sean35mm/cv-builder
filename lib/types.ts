import type {
  ProfileContent,
  SectionId,
  SectionsVisibility,
} from '@/lib/profile/domain';
import type { PersistedProfileInput } from '@/lib/profile/editor';

export * from '@/lib/profile/domain';
export type {
  PersistedProfileInput,
  ProfileUpdateFormValues,
} from '@/lib/profile/editor';

export type ProfileEditorProps = {
  profile: PersistedProfileInput;
};

export type MonthInputProps = {
  value?: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export type ProfilePreviewProps = {
  profile: ProfileContent;
  sectionsOrder?: SectionId[];
  sectionsVisibility?: SectionsVisibility;
};
