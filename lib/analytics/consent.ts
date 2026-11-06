export const ANALYTICS_CONSENT_KEY = 'opencv_analytics_consent';
export type AnalyticsConsentChoice = 'yes' | 'no' | null;

export const analyticsConsentChoice = (
  value: unknown
): AnalyticsConsentChoice => (value === 'yes' || value === 'no' ? value : null);

export const analyticsConsentAllowed = (
  choice: AnalyticsConsentChoice,
  privacy: { doNotTrack?: string | null; globalPrivacyControl?: boolean }
): boolean =>
  choice === 'yes' &&
  privacy.doNotTrack !== '1' &&
  privacy.globalPrivacyControl !== true;

export const analyticsRequestHasConsent = (headers: Headers): boolean => {
  const cookie = headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_CONSENT_KEY}=`));
  return analyticsConsentAllowed(
    analyticsConsentChoice(cookie?.slice(ANALYTICS_CONSENT_KEY.length + 1)),
    {
      doNotTrack: headers.get('dnt'),
      globalPrivacyControl: headers.get('sec-gpc') === '1',
    }
  );
};

export const analyticsConsentCookie = (
  choice: AnalyticsConsentChoice,
  secure: boolean
): string =>
  `${ANALYTICS_CONSENT_KEY}=${choice ?? ''}; Path=/; SameSite=Lax; Max-Age=${choice ? 365 * 24 * 60 * 60 : 0}${secure ? '; Secure' : ''}`;
