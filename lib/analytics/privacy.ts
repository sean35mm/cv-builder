export type DeviceCategory = 'desktop' | 'mobile' | 'tablet' | 'other';

export const normalizeUtmValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '-');
  return /^[a-z0-9][a-z0-9._~-]{0,79}$/.test(normalized)
    ? normalized
    : undefined;
};

export const coarseDeviceCategory = (userAgent: string | null): DeviceCategory => {
  const value = userAgent?.toLowerCase() ?? '';
  if (/ipad|tablet|kindle|silk/.test(value)) return 'tablet';
  if (/mobi|iphone|android/.test(value)) return 'mobile';
  if (/windows|macintosh|linux|cros/.test(value)) return 'desktop';
  return 'other';
};

export const trustedVercelCountry = (
  headers: Headers,
  vercelEnvironment: string | undefined
): string | undefined => {
  if (!vercelEnvironment) return undefined;
  const value = headers.get('x-vercel-ip-country')?.toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) ? value : undefined;
};

export const safeReferrerHostname = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value || value.length > 2_000) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.hostname.toLowerCase().slice(0, 253)
      : undefined;
  } catch {
    return undefined;
  }
};
