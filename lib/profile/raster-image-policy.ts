export const MAX_PROJECT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const SAFE_RASTER_CONTENT_TYPES = [
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type SafeRasterContentType = (typeof SAFE_RASTER_CONTENT_TYPES)[number];

export type RasterUploadReservation = {
  expectedContentType: SafeRasterContentType;
  expectedSize: number;
};

const CONTENT_TYPE_EXTENSIONS: Record<SafeRasterContentType, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const normalizeSafeRasterContentType = (
  value: unknown
): SafeRasterContentType | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.split(';', 1)[0].trim().toLowerCase();
  return SAFE_RASTER_CONTENT_TYPES.includes(
    normalized as SafeRasterContentType
  )
    ? (normalized as SafeRasterContentType)
    : null;
};

export const validateRasterUploadReservation = (
  expectedContentType: unknown,
  expectedSize: unknown
): RasterUploadReservation | null => {
  const contentType = normalizeSafeRasterContentType(expectedContentType);
  if (
    !contentType ||
    typeof expectedSize !== 'number' ||
    !Number.isSafeInteger(expectedSize) ||
    expectedSize < 1 ||
    expectedSize > MAX_PROJECT_IMAGE_SIZE_BYTES
  ) {
    return null;
  }
  return { expectedContentType: contentType, expectedSize };
};

const matches = (bytes: Uint8Array, signature: readonly number[]): boolean =>
  bytes.length >= signature.length &&
  signature.every((value, index) => bytes[index] === value);

const asciiAt = (bytes: Uint8Array, offset: number, value: string): boolean =>
  bytes.length >= offset + value.length &&
  Array.from(value).every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0)
  );

export const detectSafeRasterContentType = (
  bytes: Uint8Array
): SafeRasterContentType | null => {
  if (matches(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (asciiAt(bytes, 0, 'GIF87a') || asciiAt(bytes, 0, 'GIF89a')) {
    return 'image/gif';
  }
  if (asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP')) {
    return 'image/webp';
  }
  if (
    asciiAt(bytes, 4, 'ftyp') &&
    (asciiAt(bytes, 8, 'avif') || asciiAt(bytes, 8, 'avis'))
  ) {
    return 'image/avif';
  }
  return null;
};

export const validateRasterContent = (
  declaredContentType: unknown,
  bytes: Uint8Array
): SafeRasterContentType | null => {
  const declared = normalizeSafeRasterContentType(declaredContentType);
  return declared && detectSafeRasterContentType(bytes) === declared
    ? declared
    : null;
};

export const rasterProxyHeaders = (
  contentType: SafeRasterContentType,
  contentLength: number
): Record<string, string> => ({
  'Cache-Control': 'private, no-store, max-age=0',
  'Content-Disposition': `inline; filename="image.${CONTENT_TYPE_EXTENSIONS[contentType]}"`,
  'Content-Length': String(contentLength),
  'Content-Security-Policy': "default-src 'none'; sandbox",
  'Content-Type': contentType,
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
});

export const RASTER_FAILURE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Content-Security-Policy': "default-src 'none'; sandbox",
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
} as const;
