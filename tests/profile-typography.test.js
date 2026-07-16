import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_PROFILE_TYPOGRAPHY,
  PROFILE_FONT_IDS,
  getPdfFontFamily,
  getProfileTypographyAttributes,
  resolveProfileFontId,
  resolveProfileTypography,
} from '../lib/profile/typography';

describe('profile typography', () => {
  test('resolves every supported font ID', () => {
    expect(PROFILE_FONT_IDS.map(resolveProfileFontId)).toEqual(PROFILE_FONT_IDS);
  });

  test('falls back safely for missing and invalid persisted values', () => {
    expect(resolveProfileFontId('uploaded-font')).toBe('default');
    expect(resolveProfileFontId(undefined)).toBe('default');
    expect(resolveProfileTypography()).toEqual(DEFAULT_PROFILE_TYPOGRAPHY);
    expect(
      resolveProfileTypography({ headingFont: 'serif', bodyFont: 'invalid' })
    ).toEqual({ headingFont: 'serif', bodyFont: 'default' });
  });

  test('emits only safe wrapper typography attributes', () => {
    expect(getProfileTypographyAttributes()).toEqual({
      className: 'profile-typography',
    });
    expect(
      getProfileTypographyAttributes({ headingFont: 'mono', bodyFont: 'serif' })
    ).toEqual({
      className: 'profile-typography',
      'data-heading-font': 'mono',
      'data-body-font': 'serif',
    });
    expect(
      getProfileTypographyAttributes({ headingFont: 'invalid', bodyFont: 'sans' })
    ).toEqual({
      className: 'profile-typography',
      'data-body-font': 'sans',
    });
  });

  test('maps semantic choices to PDF core font families', () => {
    expect(getPdfFontFamily('default')).toEqual({
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
    });
    expect(getPdfFontFamily('sans')).toEqual({
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
    });
    expect(getPdfFontFamily('serif')).toEqual({
      regular: 'Times-Roman',
      bold: 'Times-Bold',
    });
    expect(getPdfFontFamily('mono')).toEqual({
      regular: 'Courier',
      bold: 'Courier-Bold',
    });
  });
});
