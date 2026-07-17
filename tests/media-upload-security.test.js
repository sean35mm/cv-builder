import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  MAX_MULTIPART_IMAGE_OVERHEAD_BYTES,
  parseDeclaredMultipartImage,
} from '../lib/profile/request-security';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('managed media upload boundaries', () => {
  test('has no public Convex upload URL or finalization API', () => {
    const storage = source('convex/storage.ts');
    const uploader = source('components/editor/managed-media-uploader.tsx');

    expect(storage).not.toMatch(/export const generateUploadUrl\s*=\s*mutation/);
    expect(storage).not.toMatch(/export const finalizeImageUpload\s*=\s*action/);
    expect(uploader).not.toContain('api.storage.generateUploadUrl');
    expect(uploader).not.toContain('api.storage.finalizeImageUpload');
    expect(uploader).toContain("fetch('/api/uploads/images'");
  });

  test('does not eagerly delete media from a shared unsaved draft', () => {
    for (const path of [
      'components/editor/managed-media-uploader.tsx',
      'components/editor/project-entry-row.tsx',
      'components/editor/section-exhibitions.tsx',
      'components/editor/section-awards.tsx',
    ]) {
      const contents = source(path);
      expect(contents).not.toContain('useManagedPreviewCleanup');
      expect(contents).not.toContain('deleteImage(');
    }
  });

  test('declares the image before reserving and consuming the multipart body', () => {
    const route = source('app/api/uploads/images/route.ts');
    const uploader = source('components/editor/managed-media-uploader.tsx');
    const reserveIndex = route.indexOf("'upload-reserve'");

    expect(uploader).toContain("'X-Upload-Content-Type': contentType");
    expect(uploader).toContain("'X-Upload-Size': String(file.size)");
    expect(reserveIndex).toBeGreaterThan(-1);
    expect(route.indexOf('request.formData()')).toBeGreaterThan(reserveIndex);
    expect(route.indexOf('file.arrayBuffer()')).toBeGreaterThan(reserveIndex);
    expect(route.indexOf('reservation.status === 429')).toBeGreaterThan(
      reserveIndex
    );
    expect(route.indexOf('reservation.status === 429')).toBeLessThan(
      route.indexOf('request.formData()')
    );
    expect(route.indexOf('parseDeclaredMultipartImage(request)')).toBeLessThan(
      reserveIndex
    );
  });

  test('strictly validates declared image headers against bounded request size', () => {
    const request = (headers = {}) =>
      new Request('https://example.com/api/uploads/images', {
        method: 'POST',
        headers: {
          'content-length': String(128),
          'x-upload-content-type': 'image/png',
          'x-upload-size': '64',
          ...headers,
        },
      });

    expect(parseDeclaredMultipartImage(request())).toEqual({
      contentType: 'image/png',
      size: 64,
    });
    expect(
      parseDeclaredMultipartImage(
        request({
          'x-upload-content-type': 'image/png; charset=binary',
        })
      )
    ).toBeNull();
    expect(
      parseDeclaredMultipartImage(request({ 'x-upload-size': '0' }))
    ).toBeNull();
    expect(
      parseDeclaredMultipartImage(
        request({ 'content-length': String(64 - 1) })
      )
    ).toBeNull();
    expect(
      parseDeclaredMultipartImage(
        request({
          'content-length': String(64 + MAX_MULTIPART_IMAGE_OVERHEAD_BYTES + 1),
        })
      )
    ).toBeNull();
  });
});
