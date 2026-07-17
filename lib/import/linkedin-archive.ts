import { unzip } from 'fflate';

export const LINKEDIN_IMPORT_LIMITS = {
  maxCompressedBytes: 25 * 1024 * 1024,
  maxUncompressedBytes: 100 * 1024 * 1024,
  maxFiles: 100,
  maxFileBytes: 10 * 1024 * 1024,
  maxCompressionRatio: 100,
} as const;

export const LINKEDIN_FILE_NAMES = {
  'positions.csv': 'positions.csv',
  'education.csv': 'education.csv',
  'skills.csv': 'skills.csv',
  'certifications.csv': 'certifications.csv',
  'projects.csv': 'projects.csv',
  'languages.csv': 'languages.csv',
  'publications.csv': 'publications.csv',
} as const;

export type LinkedInExpectedFileName = keyof typeof LINKEDIN_FILE_NAMES;

type ZipEntry = {
  archiveName: string;
  normalizedName: string;
  expectedName?: LinkedInExpectedFileName;
  flags: number;
  method: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

const safeArchiveName = (value: string): string => {
  const normalized = value.replace(/\\/g, '/').normalize('NFC');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.includes('\0') ||
    /^[A-Za-z]:/.test(normalized)
  ) {
    throw new Error('The ZIP contains an unsafe file name.');
  }
  const directory = normalized.endsWith('/');
  const segments = normalized
    .split('/')
    .filter((segment) => segment && segment !== '.');
  if (!segments.length || segments.some((segment) => segment === '..')) {
    throw new Error('The ZIP contains an unsafe file name.');
  }
  return `${segments.join('/')}${directory ? '/' : ''}`;
};

const expectedFileName = (
  archiveName: string
): LinkedInExpectedFileName | undefined => {
  if (archiveName.endsWith('/')) return undefined;
  const basename = archiveName
    .split('/')
    .at(-1)
    ?.normalize('NFC')
    .toLowerCase();
  return basename && basename in LINKEDIN_FILE_NAMES
    ? (basename as LinkedInExpectedFileName)
    : undefined;
};

const encryptedFlags = 0x0001 | 0x0040;

const readZipEntries = (bytes: Uint8Array): ZipEntry[] => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimumEocdOffset = Math.max(0, bytes.byteLength - 65_557);
  let eocdOffset = -1;
  for (
    let offset = bytes.byteLength - 22;
    offset >= minimumEocdOffset;
    offset -= 1
  ) {
    if (
      view.getUint32(offset, true) === 0x06054b50 &&
      offset + 22 + view.getUint16(offset + 20, true) === bytes.byteLength
    ) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('The ZIP directory could not be read.');
  if (
    view.getUint16(eocdOffset + 4, true) !== 0 ||
    view.getUint16(eocdOffset + 6, true) !== 0
  ) {
    throw new Error('Multi-part ZIP archives are not supported.');
  }
  const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
  const count = view.getUint16(eocdOffset + 10, true);
  if (entriesOnDisk !== count) {
    throw new Error('The ZIP entry counts do not match.');
  }
  const centralSize = view.getUint32(eocdOffset + 12, true);
  const centralOffset = view.getUint32(eocdOffset + 16, true);
  if (count > LINKEDIN_IMPORT_LIMITS.maxFiles) {
    throw new Error('The ZIP contains too many files.');
  }
  if (
    centralOffset === 0xffffffff ||
    centralSize === 0xffffffff ||
    centralOffset > eocdOffset ||
    centralSize > eocdOffset - centralOffset ||
    centralOffset + centralSize !== eocdOffset
  ) {
    throw new Error('ZIP64 or malformed ZIP archives are not supported.');
  }

  const decoder = new TextDecoder('utf-8', { fatal: true });
  const entries: ZipEntry[] = [];
  const normalizedNames = new Set<string>();
  const expected = new Set<LinkedInExpectedFileName>();
  let totalUncompressed = 0;
  let offset = centralOffset;
  const centralEnd = centralOffset + centralSize;
  for (let index = 0; index < count; index += 1) {
    if (
      offset + 46 > centralEnd ||
      view.getUint32(offset, true) !== 0x02014b50
    ) {
      throw new Error('The ZIP directory is malformed.');
    }
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const diskStart = view.getUint16(offset + 34, true);
    const crc32 = view.getUint32(offset + 16, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    if (diskStart !== 0)
      throw new Error('Multi-part ZIP archives are not supported.');
    if (flags & encryptedFlags) {
      throw new Error('Encrypted ZIP archives are not supported.');
    }
    if (method !== 0 && method !== 8) {
      throw new Error('The ZIP uses an unsupported compression method.');
    }
    if (
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localHeaderOffset === 0xffffffff
    ) {
      throw new Error('ZIP64 archives are not supported.');
    }
    if (method === 0 && compressedSize !== uncompressedSize) {
      throw new Error('The ZIP entry sizes are inconsistent.');
    }
    if (uncompressedSize > LINKEDIN_IMPORT_LIMITS.maxFileBytes) {
      throw new Error('A ZIP entry exceeds the per-file size limit.');
    }
    if (
      uncompressedSize > 0 &&
      (compressedSize === 0 ||
        uncompressedSize / compressedSize >
          LINKEDIN_IMPORT_LIMITS.maxCompressionRatio)
    ) {
      throw new Error('The ZIP has an unsafe compression ratio.');
    }
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > LINKEDIN_IMPORT_LIMITS.maxUncompressedBytes) {
      throw new Error('The ZIP exceeds the total uncompressed size limit.');
    }
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    const entryEnd = nameEnd + extraLength + commentLength;
    if (entryEnd > centralEnd)
      throw new Error('The ZIP directory is malformed.');
    let archiveName: string;
    let normalizedName: string;
    try {
      archiveName = decoder.decode(bytes.subarray(nameStart, nameEnd));
      normalizedName = safeArchiveName(archiveName);
    } catch (error) {
      if (error instanceof Error && error.message.includes('unsafe'))
        throw error;
      throw new Error('ZIP file names must use UTF-8.');
    }
    const normalizedKey = normalizedName.replace(/\/$/, '').toLowerCase();
    if (normalizedNames.has(normalizedKey)) {
      throw new Error('The ZIP contains duplicate normalized file names.');
    }
    normalizedNames.add(normalizedKey);
    const expectedName = expectedFileName(normalizedName);
    if (expectedName && expected.has(expectedName)) {
      throw new Error(`The ZIP contains duplicate ${expectedName} files.`);
    }
    if (expectedName) expected.add(expectedName);
    entries.push({
      archiveName,
      normalizedName,
      expectedName,
      flags,
      method,
      crc32,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    offset = entryEnd;
  }
  if (entries.length !== count || offset !== centralEnd) {
    throw new Error('The ZIP directory entry count or size is inconsistent.');
  }

  const localRanges = entries
    .map((entry) => {
      const localOffset = entry.localHeaderOffset;
      if (
        localOffset + 30 > centralOffset ||
        view.getUint32(localOffset, true) !== 0x04034b50
      ) {
        throw new Error('A ZIP local file header is malformed.');
      }
      const localFlags = view.getUint16(localOffset + 6, true);
      const localMethod = view.getUint16(localOffset + 8, true);
      const localCrc32 = view.getUint32(localOffset + 14, true);
      const localCompressedSize = view.getUint32(localOffset + 18, true);
      const localUncompressedSize = view.getUint32(localOffset + 22, true);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      if (localFlags & encryptedFlags) {
        throw new Error('Encrypted ZIP archives are not supported.');
      }
      if (localFlags !== entry.flags || localMethod !== entry.method) {
        throw new Error('ZIP local and central headers do not match.');
      }
      if (
        !(entry.flags & 0x0008) &&
        (localCrc32 !== entry.crc32 ||
          localCompressedSize !== entry.compressedSize ||
          localUncompressedSize !== entry.uncompressedSize)
      ) {
        throw new Error('ZIP local and central sizes do not match.');
      }
      if (
        entry.flags & 0x0008 &&
        ((localCrc32 !== 0 && localCrc32 !== entry.crc32) ||
          (localCompressedSize !== 0 &&
            localCompressedSize !== entry.compressedSize) ||
          (localUncompressedSize !== 0 &&
            localUncompressedSize !== entry.uncompressedSize))
      ) {
        throw new Error('ZIP local and central sizes do not match.');
      }
      const localNameStart = localOffset + 30;
      const localNameEnd = localNameStart + localNameLength;
      const dataStart = localNameEnd + localExtraLength;
      const dataEnd = dataStart + entry.compressedSize;
      if (dataStart > centralOffset || dataEnd > centralOffset) {
        throw new Error('A ZIP entry overlaps the central directory.');
      }
      let localName: string;
      try {
        localName = safeArchiveName(
          decoder.decode(bytes.subarray(localNameStart, localNameEnd))
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('unsafe'))
          throw error;
        throw new Error('ZIP file names must use UTF-8.');
      }
      if (localName !== entry.normalizedName) {
        throw new Error('ZIP local and central file names do not match.');
      }
      return { start: localOffset, end: dataEnd };
    })
    .sort((left, right) => left.start - right.start);
  for (let index = 1; index < localRanges.length; index += 1) {
    if (localRanges[index - 1].end > localRanges[index].start) {
      throw new Error('ZIP entries overlap.');
    }
  }
  return entries;
};

export type ExtractedLinkedInFiles = {
  files: Partial<Record<LinkedInExpectedFileName, Uint8Array>>;
  ignoredFiles: string[];
};

export async function extractLinkedInFiles(
  fileName: string,
  bytes: Uint8Array
): Promise<ExtractedLinkedInFiles> {
  if (bytes.byteLength > LINKEDIN_IMPORT_LIMITS.maxCompressedBytes) {
    throw new Error('The selected file exceeds the 25 MiB limit.');
  }
  const lowerName = fileName.normalize('NFC').toLowerCase();
  if (!lowerName.endsWith('.zip')) {
    const name = expectedFileName(safeArchiveName(fileName));
    if (!name) {
      throw new Error(
        'Use a LinkedIn ZIP or one of the documented LinkedIn CSV file names.'
      );
    }
    if (bytes.byteLength > LINKEDIN_IMPORT_LIMITS.maxFileBytes) {
      throw new Error('The CSV exceeds the 10 MiB per-file limit.');
    }
    return { files: { [name]: bytes }, ignoredFiles: [] };
  }

  const entries = readZipEntries(bytes);
  const wanted = new Map(
    entries
      .filter((entry) => entry.expectedName)
      .map((entry) => [entry.archiveName, entry.expectedName!])
  );
  const ignoredFiles = entries
    .filter(
      (entry) => !entry.expectedName && !entry.normalizedName.endsWith('/')
    )
    .map((entry) => entry.normalizedName);
  const unzipped = await new Promise<Record<string, Uint8Array>>(
    (resolve, reject) => {
      unzip(
        bytes,
        {
          filter: (entry) => wanted.has(entry.name),
        },
        (error, result) => {
          if (error)
            reject(new Error('The ZIP could not be safely decompressed.'));
          else resolve(result);
        }
      );
    }
  );
  const files: Partial<Record<LinkedInExpectedFileName, Uint8Array>> = {};
  for (const [archiveName, expectedName] of wanted) {
    const value = unzipped[archiveName];
    if (!value || value.byteLength > LINKEDIN_IMPORT_LIMITS.maxFileBytes) {
      throw new Error('A decompressed ZIP entry is invalid or too large.');
    }
    files[expectedName] = value;
  }
  return { files, ignoredFiles };
}
