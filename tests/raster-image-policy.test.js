import { describe, expect, test } from 'bun:test';
import {
  SAFE_RASTER_CONTENT_TYPES,
  detectSafeRasterContentType,
  normalizeSafeRasterContentType,
  rasterProxyHeaders,
  validateRasterUploadReservation,
  validateRasterContent,
} from '../lib/profile/raster-image-policy';

const ascii = (value) => new TextEncoder().encode(value);

const fixtures = [
  ['image/jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0xe0])],
  [
    'image/png',
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  ],
  ['image/gif', ascii('GIF89a')],
  ['image/webp', ascii('RIFF0000WEBP')],
  [
    'image/avif',
    new Uint8Array([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69,
      0x66,
    ]),
  ],
];

describe('safe raster image policy', () => {
  test.each(fixtures)('accepts %s only when its signature matches', (type, bytes) => {
    expect(normalizeSafeRasterContentType(type)).toBe(type);
    expect(detectSafeRasterContentType(bytes)).toBe(type);
    expect(validateRasterContent(type, bytes)).toBe(type);
  });

  test('validates every approved raster type for upload reservation', () => {
    for (const contentType of SAFE_RASTER_CONTENT_TYPES) {
      expect(validateRasterUploadReservation(contentType, 128)).toEqual({
        expectedContentType: contentType,
        expectedSize: 128,
      });
    }
    expect(validateRasterUploadReservation('image/svg+xml', 128)).toBeNull();
  });

  test('rejects active content and declared/signature mismatches', () => {
    const svg = ascii('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>');
    const html = ascii('<!doctype html><script>alert(1)</script>');
    const xml = ascii('<?xml version="1.0"?><svg/>');

    expect(normalizeSafeRasterContentType('image/svg+xml')).toBeNull();
    expect(validateRasterContent('image/svg+xml', svg)).toBeNull();
    expect(validateRasterContent('image/png', html)).toBeNull();
    expect(validateRasterContent('image/jpeg', xml)).toBeNull();
    expect(validateRasterContent('image/png', fixtures[0][1])).toBeNull();
  });

  test('emits non-replayable, non-sniffable media response headers', () => {
    const headers = rasterProxyHeaders('image/png', 128);
    expect(headers).toMatchObject({
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Disposition': 'inline; filename="image.png"',
      'Content-Length': '128',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Type': 'image/png',
      'X-Content-Type-Options': 'nosniff',
    });
    expect(headers.Location).toBeUndefined();
  });
});
