import { describe, expect, test } from 'bun:test';
import { strToU8, zipSync } from 'fflate';

import { extractLinkedInFiles } from '../lib/import/linkedin-archive';
import { normalizeLinkedInDedupeText } from '../lib/import/linkedin-dedupe';
import { mergeLinkedInImport } from '../lib/import/linkedin-merge';
import { readLinkedInImportFile } from '../lib/import/linkedin-preflight';
import {
  mapLinkedInCsvFiles,
  normalizeLinkedInMonth,
  sanitizeCsvCell,
} from '../lib/import/linkedin-parser';
import { toFormValues } from '../lib/profile/editor';

const signatureOffset = (bytes, signature) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.byteLength - 4; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === signature) return offset;
  }
  throw new Error('ZIP signature not found');
};

const zipOffsets = (bytes) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = signatureOffset(bytes, 0x06054b50);
  const central = view.getUint32(eocd + 16, true);
  const local = view.getUint32(central + 42, true);
  return { view, eocd, central, local };
};

describe('LinkedIn export import', () => {
  test('preflights file type and size before reading the file body', async () => {
    let reads = 0;
    const file = (metadata) => ({
      ...metadata,
      arrayBuffer: async () => {
        reads += 1;
        throw new Error('file body should not be read');
      },
    });

    await expect(
      readLinkedInImportFile(
        file({
          name: 'export.ZIP',
          type: 'APPLICATION/ZIP',
          size: 25 * 1024 * 1024 + 1,
        })
      )
    ).rejects.toThrow('25 MiB limit');
    expect(reads).toBe(0);

    await expect(
      readLinkedInImportFile(
        file({
          name: 'Positions.csv',
          type: 'text/csv',
          size: 10 * 1024 * 1024 + 1,
        })
      )
    ).rejects.toThrow('10 MiB per-file limit');
    expect(reads).toBe(0);

    await expect(
      readLinkedInImportFile(
        file({
          name: 'export.txt',
          type: 'application/octet-stream',
          size: 1,
        })
      )
    ).rejects.toThrow('supported CSV');
    expect(reads).toBe(0);

    await expect(
      readLinkedInImportFile(
        file({
          name: 'Positions.csv',
          type: 'application/octet-stream',
          size: 1,
        })
      )
    ).rejects.toThrow('supported CSV');
    expect(reads).toBe(0);

    const valid = {
      name: 'Positions.CSV',
      type: 'text/csv',
      size: 1,
      arrayBuffer: async () => {
        reads += 1;
        return new ArrayBuffer(0);
      },
    };
    await expect(readLinkedInImportFile(valid)).resolves.toEqual(
      new Uint8Array()
    );
    expect(reads).toBe(1);
  });

  test('maps documented English columns, normalizes dates, URLs, and deterministic IDs', () => {
    const files = {
      'positions.csv': strToU8(
        'Title,Company Name,Started On,Finished On,Description\nEngineer,Example Co,Jan 2020,,Built systems'
      ),
      'languages.csv': strToU8(
        'Name,Proficiency\nEnglish,Native or bilingual proficiency'
      ),
      'publications.csv': strToU8(
        'Title,Publisher,Published On,URL,Authors,Description\nPaper,Journal,2024,https://example.com/paper,"Ada Lovelace; Grace Hopper",Notes'
      ),
    };
    const first = mapLinkedInCsvFiles(files);
    const second = mapLinkedInCsvFiles(files);

    expect(first.data.experience[0]).toMatchObject({
      role: 'Engineer',
      company: 'Example Co',
      startDate: '2020-01',
      current: true,
    });
    expect(first.data.languages[0].proficiency).toBe('native');
    expect(first.data.publications[0].authors).toEqual([
      'Ada Lovelace',
      'Grace Hopper',
    ]);
    expect(first.data.experience[0].id).toBe(second.data.experience[0].id);
    expect(first.data.experience[0].id).toBe(
      'linkedin:experience:positions.csv:2'
    );
    expect(normalizeLinkedInMonth('09/2023')).toBe('2023-09');
  });

  test('aborts CSV parsing when row, column, or cell bounds are exceeded', () => {
    const highRows = [
      'Title,Company Name,Started On',
      ...Array.from(
        { length: 2_001 },
        (_, index) => `Engineer ${index},Example Co,2020`
      ),
    ].join('\n');
    const rowResult = mapLinkedInCsvFiles({
      'positions.csv': strToU8(highRows),
    });
    expect(rowResult.data.experience).toEqual([]);
    expect(rowResult.warnings.join(' ')).toContain(
      'exceeds the 2000-row limit'
    );

    const highColumns = [
      'Title',
      'Company Name',
      'Started On',
      ...Array.from({ length: 98 }, (_, index) => `Extra ${index}`),
    ].join(',');
    const columnResult = mapLinkedInCsvFiles({
      'positions.csv': strToU8(`${highColumns}\nEngineer,Example Co,2020`),
    });
    expect(columnResult.data.experience).toEqual([]);
    expect(columnResult.warnings.join(' ')).toContain(
      'exceeds the 100-column limit'
    );

    const cellResult = mapLinkedInCsvFiles({
      'skills.csv': strToU8(`Name\n${'a'.repeat(5_001)}`),
    });
    expect(cellResult.data.skills).toEqual([]);
    expect(cellResult.warnings.join(' ')).toContain(
      'exceeds the 5000-character limit'
    );
  });

  test('does not guess localized columns and neutralizes formula-like cells', () => {
    const result = mapLinkedInCsvFiles({
      'skills.csv': strToU8('Habilidad\n=HYPERLINK("https://bad")'),
    });
    expect(result.data.skills).toEqual([]);
    expect(result.warnings.join(' ')).toContain('not guessed');
    expect(sanitizeCsvCell('=SUM(1,2)')).toBe("'=SUM(1,2)");
  });

  test('rejects bombs and duplicate expected files before extraction', async () => {
    const bomb = zipSync({
      'Positions.csv': new Uint8Array(2 * 1024 * 1024),
    });
    await expect(extractLinkedInFiles('export.zip', bomb)).rejects.toThrow(
      'compression ratio'
    );

    const duplicate = zipSync({
      'one/Positions.csv': strToU8('Title\nOne'),
      'two/positions.csv': strToU8('Title\nTwo'),
    });
    await expect(extractLinkedInFiles('export.zip', duplicate)).rejects.toThrow(
      'duplicate positions.csv'
    );
  });

  test('validates EOCD counts and local headers before decompression', async () => {
    const countMismatch = zipSync({
      'Positions.csv': strToU8(
        'Title,Company Name,Started On\nEngineer,Example,2020'
      ),
      'extra-bomb.txt': new Uint8Array(2 * 1024 * 1024),
    });
    const mismatchOffsets = zipOffsets(countMismatch);
    mismatchOffsets.view.setUint16(mismatchOffsets.eocd + 8, 1, true);
    await expect(
      extractLinkedInFiles('export.zip', countMismatch)
    ).rejects.toThrow('entry counts do not match');

    const encryptedLocal = zipSync({
      'Positions.csv': strToU8(
        'Title,Company Name,Started On\nEngineer,Example,2020'
      ),
    });
    const encryptedOffsets = zipOffsets(encryptedLocal);
    encryptedOffsets.view.setUint16(
      encryptedOffsets.local + 6,
      encryptedOffsets.view.getUint16(encryptedOffsets.local + 6, true) | 1,
      true
    );
    await expect(
      extractLinkedInFiles('export.zip', encryptedLocal)
    ).rejects.toThrow('Encrypted ZIP archives');

    const mismatchedSize = zipSync({
      'Positions.csv': strToU8(
        'Title,Company Name,Started On\nEngineer,Example,2020'
      ),
    });
    const sizeOffsets = zipOffsets(mismatchedSize);
    sizeOffsets.view.setUint32(
      sizeOffsets.local + 18,
      sizeOffsets.view.getUint32(sizeOffsets.local + 18, true) + 1,
      true
    );
    await expect(
      extractLinkedInFiles('export.zip', mismatchedSize)
    ).rejects.toThrow('local and central sizes do not match');
  });

  test('uses row-based collision-free IDs and full locale-independent dedupe keys', () => {
    const files = {
      'positions.csv': strToU8(
        [
          'Title,Company Name,Started On,Description',
          'NJWdrFC8cpNA,Example,2020,First',
          'cZbMJqfAqGnt,Example,2020,Second',
          'NJWdrFC8cpNA,Example,2020,First',
          'NJWdrFC8cpNA,Example,2020,Different description',
        ].join('\n')
      ),
    };
    const first = mapLinkedInCsvFiles(files);
    const repeated = mapLinkedInCsvFiles(files);

    expect(first.data.experience).toHaveLength(3);
    expect(new Set(first.data.experience.map((entry) => entry.id)).size).toBe(
      3
    );
    expect(first.data.experience.map((entry) => entry.id)).toEqual(
      repeated.data.experience.map((entry) => entry.id)
    );
    expect(normalizeLinkedInDedupeText('CAFE\u0301')).toBe('café');
    expect(normalizeLinkedInDedupeText('I')).toBe('i');
  });

  test('append-and-dedupe merge preserves current entries and caps sections', () => {
    const current = toFormValues({
      username: 'ada',
      name: 'Ada',
      experience: [],
      education: [],
      skills: ['Math'],
      languages: [{ id: 'current', name: 'English' }],
      projects: [],
      publications: [],
      certifications: [],
      volunteering: [],
      exhibitions: [],
      awards: [],
      interests: [],
      isPublic: false,
    });
    const imported = {
      experience: [],
      education: [],
      skills: ['math', 'Computing'],
      certifications: [],
      projects: [],
      languages: [
        { id: 'imported-en', name: 'english' },
        { id: 'imported-fr', name: 'French' },
      ],
      publications: [],
    };
    const merged = mergeLinkedInImport(
      current,
      imported,
      new Set(['skills', 'languages'])
    );
    expect(merged.skills).toEqual(['Math', 'Computing']);
    expect(merged.languages.map((entry) => entry.name)).toEqual([
      'English',
      'French',
    ]);

    const normalizedMerge = mergeLinkedInImport(
      { ...current, skills: ['CAFÉ'] },
      { ...imported, skills: ['CAFE\u0301'] },
      new Set(['skills'])
    );
    expect(normalizedMerge.skills).toEqual(['CAFÉ']);
  });
});
