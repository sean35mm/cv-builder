import {
  MAX_PROJECT_IMAGE_SIZE_BYTES,
  normalizeSafeRasterContentType,
  type SafeRasterContentType,
} from './raster-image-policy';

export const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
} as const;

export const DEFAULT_MAX_JSON_BYTES = 32 * 1024;

export const privateNoStoreNotFoundResponse = (): Response =>
  new Response(null, { status: 404, headers: PRIVATE_NO_STORE_HEADERS });

export async function readBoundedJson<T = unknown>(
  request: Request,
  maxBytes = DEFAULT_MAX_JSON_BYTES
): Promise<T> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error('Invalid request');
  }
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes) {
      throw new Error('Invalid request');
    }
  }
  if (!request.body) throw new Error('Invalid request');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('Invalid request');
      }
      chunks.push(value);
    }
    if (total === 0) throw new Error('Invalid request');
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid request');
  } finally {
    reader.releaseLock();
  }
}

export const MAX_MULTIPART_IMAGE_REQUEST_BYTES =
  MAX_PROJECT_IMAGE_SIZE_BYTES + 256 * 1024;
export const MAX_MULTIPART_IMAGE_OVERHEAD_BYTES = 256 * 1024;

export type DeclaredMultipartImage = {
  contentType: SafeRasterContentType;
  size: number;
};

const parseBoundedContentLength = (request: Request): number | null => {
  const contentLength = request.headers.get('content-length');
  if (!contentLength || !/^\d+$/.test(contentLength)) return null;
  const parsedLength = Number(contentLength);
  return Number.isSafeInteger(parsedLength) && parsedLength > 0
    ? parsedLength
    : null;
};

export const parseDeclaredMultipartImage = (
  request: Request
): DeclaredMultipartImage | null => {
  const contentTypeHeader = request.headers.get('x-upload-content-type');
  const contentType = normalizeSafeRasterContentType(contentTypeHeader);
  if (
    !contentTypeHeader ||
    !contentType ||
    contentTypeHeader.trim().toLowerCase() !== contentType
  ) {
    return null;
  }

  const sizeHeader = request.headers.get('x-upload-size');
  if (!sizeHeader || !/^[1-9]\d*$/.test(sizeHeader)) return null;
  const size = Number(sizeHeader);
  if (
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > MAX_PROJECT_IMAGE_SIZE_BYTES
  ) {
    return null;
  }

  const contentLength = parseBoundedContentLength(request);
  if (
    contentLength === null ||
    contentLength < size ||
    contentLength - size > MAX_MULTIPART_IMAGE_OVERHEAD_BYTES
  ) {
    return null;
  }
  return { contentType, size };
};

const isSameOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }
  if (parsedOrigin.host !== host) return false;
  const requestProtocol = new URL(request.url).protocol;
  if (parsedOrigin.protocol !== requestProtocol) return false;
  const fetchSite = request.headers.get('sec-fetch-site');
  return !fetchSite || fetchSite === 'same-origin';
};

export const isSameOriginJsonPost = (request: Request): boolean => {
  if (request.method !== 'POST') return false;
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return false;
  }
  return isSameOrigin(request);
};

export const isSameOriginMultipartPost = (request: Request): boolean => {
  if (request.method !== 'POST' || !isSameOrigin(request)) return false;
  const parsedLength = parseBoundedContentLength(request);
  if (
    parsedLength === null ||
    parsedLength > MAX_MULTIPART_IMAGE_REQUEST_BYTES
  ) {
    return false;
  }

  const parts = request.headers
    .get('content-type')
    ?.split(';')
    .map((part) => part.trim());
  if (parts?.[0]?.toLowerCase() !== 'multipart/form-data') return false;
  const boundaries = parts
    .slice(1)
    .filter((part) => part.toLowerCase().startsWith('boundary='));
  if (boundaries.length !== 1) return false;
  const rawBoundary = boundaries[0].slice(boundaries[0].indexOf('=') + 1);
  const boundary =
    rawBoundary.startsWith('"') && rawBoundary.endsWith('"')
      ? rawBoundary.slice(1, -1)
      : rawBoundary;
  return (
    boundary.length > 0 &&
    boundary.length <= 70 &&
    /^[0-9A-Za-z'()+_,./:=?-]+$/.test(boundary)
  );
};
