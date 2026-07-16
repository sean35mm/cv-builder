import type { ReactNode } from 'react';
import { getProfileTypographyAttributes } from '@/lib/profile/typography';

type ProfileTypographyProps = {
  headingFont?: unknown;
  bodyFont?: unknown;
  children: ReactNode;
};

export function ProfileTypography({
  headingFont,
  bodyFont,
  children,
}: ProfileTypographyProps) {
  return (
    <div {...getProfileTypographyAttributes({ headingFont, bodyFont })}>
      {children}
    </div>
  );
}
